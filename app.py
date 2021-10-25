from re import I
import requests
from flask import Flask, request, Response, jsonify, make_response, send_from_directory
from flask_cors import CORS
from lxml import html
from icalendar import Calendar, Event

import gzip
import base64
from math import prod
import time
from itertools import product, combinations, repeat
import json
from random import shuffle
import concurrent.futures
from datetime import datetime, timedelta
import pickle

app = Flask(__name__)
CORS(app)

showFull = False
week = {
    'saturday': '2019-12-28',
    'sunday': '2019-12-29',
    'monday': '2019-12-30',
    'tuesday': '2019-12-31',
    'wednesday': '2020-01-01',
    'thursday': '2020-01-02',
    'friday': '2020-01-03'
}

def format_sse(data: str, event=None) -> str:
    msg = f'data: {data}\n\n'
    if event is not None:
        msg = f'event: {event}\n{msg}'
    return msg

def get_class_data(term, code):
    session = requests.session()
    session.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/term/search?mode=search&dataType=json&term={term}')
    data = session.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_subjectcoursecombo={code}&txt_term={term}&startDatepicker&endDatepicker&pageOffset=0&pageMaxSize=500').json()['data']
    if not data: raise Exception(f'Course "{code}" not found for term {term}!')
    return data

def is_conflict(crn1, crn2, full_data):
    times = {crn1:full_data[crn1]['meetingsFaculty'][0]['meetingTime'], crn2:full_data[crn2]['meetingsFaculty'][0]['meetingTime']}
    for day in {'saturday': '2019-12-28','sunday': '2019-12-29','monday': '2019-12-30','tuesday': '2019-12-31','wednesday': '2020-01-01','thursday': '2020-01-02','friday': '2020-01-03'}:
        if times[crn1][day] and times[crn2][day]:
            s1, e1 = int(times[crn1]['beginTime']), int(times[crn1]['endTime'])
            s2, e2 = int(times[crn2]['beginTime']), int(times[crn2]['endTime'])
            if (s1 < e2) and (e1 > s2):
                return True
    return False

@app.route('/', methods=['GET'])
def home():
    return '', 200
    
def get_course_sections(code: str, future: list, min_seats: dict, override_empty: bool, day_restrictions: list, time_restrictions: dict) -> dict:
    """
    code: ECON002, ANTH001
    future: [ [{}, {}, {}], [{}, {}, {}]]
    seats: {'53609': True, '53610': False}

    temp: {'1': {'Lecture': ['20943'], 'Studio': ['20944']}, '2': {'Lecture': ['10405'], 'Studio': ['19953']}}
    """
    temp = {}
    for section in future.result():
        num = section['linkIdentifier'][1:] if section['linkIdentifier'] and (section['linkIdentifier'][1:]).isnumeric() else 1
        type = section['scheduleTypeDescription']
        temp[num] = temp.get(num, {})
        temp[num][type] = temp[num].get(type, [])
        if (not section['meetingsFaculty'] 
            or not section['meetingsFaculty'][0]['meetingTime']['beginTime'] #async
            or section['seatsAvailable'] < min_seats
            or True in [section['meetingsFaculty'][0]['meetingTime'][day] for day in day_restrictions]
            or True in [((int(section['meetingsFaculty'][0]['meetingTime']['beginTime']) < int(''.join(i for i in restriction['end'] if i.isdigit()))) and (int(section['meetingsFaculty'][0]['meetingTime']['endTime']) > int(''.join(i for i in restriction['start'] if i.isdigit())))) for restriction in time_restrictions.values()]
        ): continue
        temp[num][type].append(section['courseReferenceNumber'])
        
    toDelete = set()
    for linkIdentifier, linkedsections in temp.items():
        for type, crnslist in linkedsections.items():
            if(len(crnslist) == 0):
                toDelete.add((linkIdentifier,type))
    for (linkIdentifier,type) in toDelete:
        if override_empty:
            del temp[linkIdentifier][type]
        if not override_empty or len(temp[linkIdentifier]) == 0:
            del temp[linkIdentifier]

    if not temp:
        raise RuntimeError(code)
    return {code : temp}
        
    
    
@app.route('/schedules', methods=['GET'])
def schedules():
    ### GET PARAMETERS ###
    term = request.args.get('term', default=None, type=str)
    codes = request.args.get('courses', default=None, type=str).split(',')
    coreqs = pickle.load(open(f'json/{term}_data/_COREQUISITES.pickle', 'rb'))
    codes += [coreq for code in codes for coreq in coreqs.get(code, [])]
    codes = list(set(codes))
    options = request.args.get('options', default={}, type=json.loads)
    _max_schedules = options.get('max_schedules', 500)
    if _max_schedules > 10000: _max_schedules = 10000
    elif _max_schedules < 1: _max_schedules = 1;
    _min_seats = options.get('min_seats', 1)
    _override_empty = options.get('allow_empty', False)
    _randomize = options.get('randomize', False)
    _day_restrictions = [day for day, enabled in options.get('day_restrictions', {}).items() if not enabled]
    _time_restrictions = options.get('time_restrictions', {})

    def stream():
        print('\n', len(codes), codes)
        if not term or not codes:
            yield format_sse(f"Missing parameter(s):{' term' if not term else ''} {' courses' if not codes else ''}", event='error')
            return
        
        ### RETRIEVE COURSE SECTION DATA ###
        start = time.perf_counter()
        full_data = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(codes)) as executor:
            futures = [(code, executor.submit(get_class_data, term, code)) for code in codes] # Add class data (code .e.g. = ART005)
            try:
                for code, future in futures:
                    for section in future.result():
                        full_data[section['courseReferenceNumber']] = section
            except Exception as e:
                yield format_sse(str(e), event='error')
                return
            futures = [executor.submit(get_course_sections, code, future, _min_seats, _override_empty, _day_restrictions, _time_restrictions) for code, future in futures]
        print('Get Class Data/Course Sections:', time.perf_counter() - start)

        ### GENERATE SECTION PAIRS ###
        start = time.perf_counter()
        section_combinations = [] # List of all possible linked sections for each course (e.g. if there are 4 courses then section_combinations will contain 4 lists)
        error_courses = [] # List of courses that do not have enough sections to make a full schedule
        crn_course_map = dict() # Maps section CRN to the course the section belings to (e.g. '39974':'STAT155')
        for future in futures:
            try:
                course_sections = future.result() # RuntimeError might be raised here if the course does not have enough section
                for course_code, sections in course_sections.items(): #STAT155 {'1': {'Lecture': ['39974'], 'Discussion': ['39975', '39976', '39977', '51548', '52200', '52201']}
                    section_comb = [] # List of linked sections for each course (contains 1 lecture section, 1 disc section, etc)
                    for link_num, link_sections in sections.items(): #{'1': {'Lecture': ['39974'], 'Discussion': ['39975', '39976', '39977', '51548', '52200', '52201']}}
                        temp = [] # List of list of section codes [['58054'], ['62842', '62843'], ['58095', '60520']] only without section types
                        for section_type, section_crns in link_sections.items():
                            temp.append(section_crns)
                            for section_crn in section_crns:
                                crn_course_map[section_crn] = course_code
                        section_comb += [x for x in product(*temp)]
                    crn_course_map[course_code] = len(section_comb)
                    if _randomize: 
                        shuffle(section_comb)
                    section_combinations.append(section_comb)
            except RuntimeError as e:
                error_courses.append(str(e))
        if error_courses:
            yield format_sse(f'Unable to find open sections for {", ".join(error_courses)}', event='error')
            return
        print('Generate Sections:', time.perf_counter() - start)
        
    
        ### CHECK IF TWO SECTIONS IN A SCHEDULE CONFLICT """
        start = time.perf_counter()
        total_schedules, valid_schedules = 0, 0
        conflicts_pickle = pickle.load(open(f'json/{term}_data/_CONFLICTS.pickle', 'rb'))
        # conflicts = frozenset([pair for pair in product([c for d in [a for b in section_combinations for a in b] for c in d], repeat=2) if pair[1] in conflicts.get(pair[0], [])])
        conflicts = set()
        conflicts_errors = dict()
        for pair in product([c for d in [a for b in section_combinations for a in b] for c in d], repeat=2):
            if (pair[0] in conflicts_pickle and pair[1] in conflicts_pickle[pair[0]]) or is_conflict(*pair, full_data):
                conflicts.add(pair)
        print('Conflicts Set Created')
        for i in product(*section_combinations):
            if (
                valid_schedules == 0 and time.perf_counter() - start > 5
                or valid_schedules >= _max_schedules
                or time.perf_counter() - start > 10
            ):
                break
            total_schedules += 1
            conflict = False
            for pair in combinations([j for sub in i for j in sub], 2):
                if pair in conflicts:
                    conflicts_errors[frozenset(pair)] = conflicts_errors.get(frozenset(pair), 0) + 1
                    conflict = True
                    break
            if conflict:
                continue
            valid_schedules += 1
            schedule, crns = {'data':[]}, set()
            for n in [j for sub in i for j in sub]:
                courseData = full_data[n]
                crns.add(courseData["courseReferenceNumber"])
                # crns.add(f'{courseData["subjectCourse"]}_{courseData["courseReferenceNumber"]}')
                for day in week:
                    if courseData['meetingsFaculty'][0]['meetingTime'][day]:
                        event = {
                            'id': n+day,
                            'start_date': f'{week[day]} {courseData["meetingsFaculty"][0]["meetingTime"]["beginTime"][:2]}:{courseData["meetingsFaculty"][0]["meetingTime"]["beginTime"][2:]}:00',
                            'end_date': f'{week[day]} {courseData["meetingsFaculty"][0]["meetingTime"]["endTime"][:2]}:{courseData["meetingsFaculty"][0]["meetingTime"]["endTime"][2:]}:00',
                            'text': f'{courseData["subject"]}{courseData["courseNumber"]} {courseData["scheduleTypeDescription"]}',
                            'details': ''
                        }
                        schedule['data'].append(event)
            yield format_sse(data=base64.b64encode(gzip.compress(json.dumps([schedule, list(crns)]).encode(), 5)))
            # yield format_sse(data=json.dumps([schedule, crns]))
        print(f'Schedule Conflicts -- VALID:{valid_schedules} -- TOTAL:{total_schedules} -- TIME:{time.perf_counter() - start}')
        if valid_schedules == 0:
            conflict_str = ', '.join([f'{crn_course_map[c1]} & {crn_course_map[c2]}' for (c1, c2), num in conflicts_errors.items() if num >= crn_course_map[crn_course_map[c1]] or num >= crn_course_map[crn_course_map[c2]]])
            yield format_sse(f'Unable to generate schedules without time conflicts! Following courses have time conflicts: {conflict_str}', event='error')
        else:
            yield format_sse(data='', event='stream-end')
    # return jsonify(stream())
    return Response(stream(), mimetype='text/event-stream')

@app.route('/term_plan', methods=['POST'])
def create_term_plan():
    data = request.get_json(force=True)
    print(data)
    plan_name = data['plan_name'] if data['plan_name'] else f'Generated Plan {time.strftime("%Y%m%d T%H:%M:%S", time.localtime())}'
    term = data['term']
    courselist = set(data['crns'])

    s = requests.Session()

    url = 'https://auth.ucr.edu/cas/login'
    tree = html.fromstring(s.get(url).content)
    auth = tree.xpath('//input[@name="execution"]/@value')
    login_data = {
        'username': data['username'],
        'password': data['password'],
        'execution': auth,
        '_eventId': 'submit',
        'geolocation': None
    }
    if 'have successfully logged' not in s.post(url, login_data).text:
        return Response('Username or password is incorrect.', status=403)
    # print('success')

    s.post(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/term/search?mode=plan&dataType=json&term={term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=')
    r = s.post('https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/plan/plan')
    # print(r.status_code)
    if r.status_code > 400:
        return Response('Error uploading term plan! Please try again in a few minutes.', status=500)

    models = []
    for crn in courselist:
        print(crn)
        addData = {
            'dataType': 'json',
            'term': term,
            'courseReferenceNumber': crn,
            'section': 'section'
        }
        try:
            r = s.post('https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/plan/addPlanItem',data=addData)
            # print(r.status_code)
            models.append(r.json()['model'])
        except:
            return Response('Error uploading term plan! Please try again in a few minutes.', status=500)
    models.append({"headerDescription": plan_name, "headerComment": None})

    submitData = {
        "create": models,
        "update": [],
        "destroy": []
    }
    response = s.post('https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/plan/submitPlan/batch', data=json.dumps(submitData))
    r = s.post('https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/plan/getPlanEvents')
    confirm = r.json()
    # print(r.status_code)
    if not confirm:
        return Response('Error uploading term plan! You already have 3 plans on RWeb!', status=500)
    # for crn, title in set([(class_dict["crn"], class_dict["title"]) for class_dict in confirm]):
    #     print(f'{crn}\t{title}')

    if data['preferred']:
        s.post('https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/plan/selectPlan')
        s.post(f"https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/plan/makePreferred?dataType=json&preferred={response.json()['data']['planHeader']['sequenceNumber']}")
    return Response('Term plan created successfully!')

@app.route('/ical', methods=['GET'])
def ical():
    term = request.args['term']
    courses = set(request.args['courses'].split(','))
    crns = set([str(c) for c in request.args['crns'].split(',')])
    found = []
    week = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    print(courses, crns)
    time_format = '%m/%d/%Y-%H%M'
    cal = Calendar()
    map = pickle.load(open(f'json/{term}_data/local/_map.pickle', 'rb'))
    for course in courses: #{'ANTH001', 'CS111'}
        if course not in map: continue
        course_data = pickle.load(open(f'json/{term}_data/local/{map[course]}.pickle', 'rb'))[course]
        for crn in crns: #{'13060', '10107', '10108', '13059'}
            if crn in found or crn not in course_data: continue
            data = course_data[crn]
            event = Event()

            dtstart = datetime.strptime(f"{data['meetingsFaculty'][0]['meetingTime']['startDate']}-{data['meetingsFaculty'][0]['meetingTime']['beginTime']}", time_format)
            # dtend = datetime.strptime(f"{data['meetingsFaculty'][0]['meetingTime']['startDate']}-{data['meetingsFaculty'][0]['meetingTime']['endTime']}", time_format)
            for i in range(7):
                if data['meetingsFaculty'][0]['meetingTime'][week[dtstart.weekday()]]:
                    break
                dtstart += timedelta(days=1)
            x = data['meetingsFaculty'][0]['meetingTime']['endTime']
            dtend = dtstart.replace(hour=int(x[:2]), minute=int(x[2:]))
            end = datetime.strptime(f"{data['meetingsFaculty'][0]['meetingTime']['endDate']}-{data['meetingsFaculty'][0]['meetingTime']['beginTime']}", time_format)
            BYDAY = [day[:2] for day in week if data['meetingsFaculty'][0]['meetingTime'][day]]
            location = f"{data['meetingsFaculty'][0]['meetingTime']['buildingDescription']} - Room {data['meetingsFaculty'][0]['meetingTime']['room']}" if data['meetingsFaculty'][0]['meetingTime']['buildingDescription'] and data['meetingsFaculty'][0]['meetingTime']['room'] and data['meetingsFaculty'][0]['meetingTime']['buildingDescription'].lower() != data['meetingsFaculty'][0]['meetingTime']['room'].lower() else data['meetingsFaculty'][0]['meetingTime']['room']
            summary = f"{data['subjectCourse']} {data['scheduleTypeDescription']}"
            description = f"Instructor: {data['faculty'][0]['displayName'] if data['faculty'] else ''}\nSection Number: {data['sequenceNumber']}\nTitle: {data['courseTitle']}\nCredit Hours: {data['creditHours']}"

            event.add('dtstart', dtstart)
            event.add('dtend', dtend)
            event.add('summary', summary) #Title
            event.add('description', description) #desc
            event.add('location', location)
            event.add('rrule', {'freq': 'weekly','byday':BYDAY,'until':end})

            cal.add_component(event)
            found.append(crn)
    if len(found) != len(crns):
        print('ERROR', found, crns)
    filename = f"{str(time.time()).replace('.', '')}.ics"
    with open(f"cal/{filename}", 'w') as file:
        file.write(cal.to_ical().decode("utf-8") )
    return filename
    
    # response = make_response(cal.to_ical())
    # response.headers["Content-Disposition"] = "attachment; filename=schedule.ics"
    # response.headers["Content-Type"] = "text/calendar"
    # return response

@app.route('/cal/<path:path>')
def send_cal(path):
    return send_from_directory('cal', path)