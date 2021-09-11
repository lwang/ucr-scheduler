from re import I
import requests
from flask import Flask, request, Response, jsonify, make_response
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

@app.route('/', methods=['GET'])
def home():
    temp = request.args.get('temp', default=[], type=json.loads)
    print(temp)
    return {'data':temp}, 200
    
def get_course_sections(code, future, min_seats, day_restrictions, time_restrictions):
    """
    code: READ -- ECON002, ANTH001
    future: READ -- [ [{}, {}, {}], [{}, {}, {}]]
    seats: READ -- {'53609': True, '53610': False}

    temp: OUT -- {'1': {'Lecture': ['20943'], 'Studio': ['20944']}, '2': {'Lecture': ['10405'], 'Studio': ['19953']}}
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
            or True in [((int(section['meetingsFaculty'][0]['meetingTime']['beginTime']) < int(restriction['end'])) and (int(section['meetingsFaculty'][0]['meetingTime']['endTime']) > int(restriction['start']))) for restriction in time_restrictions]
        ): continue


        temp[num][type].append(section['courseReferenceNumber'])

    toDelete = set()
    for linkIdentifier in temp:
        for type in temp[linkIdentifier]:
            if(len(temp[linkIdentifier][type]) == 0):
                toDelete.add(linkIdentifier)
                break
    for section in toDelete:
        del temp[section]

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
    options = request.args.get('options', default={}, type=json.loads)
    _max_schedules = options['max_schedules'] #request.args.get('max_schedules', default=500, type=int)
    if _max_schedules > 1000: _max_schedules = 1000
    elif _max_schedules < 1: _max_schedules = 1;
    _min_seats = options['min_seats'] #request.args.get('min_seats', default=0, type=int)
    _randomize = options['randomize'] #request.args.get('randomize', default=False, type=lambda v: v.lower() == 'true')
    _day_restrictions = [day for day, enabled in options['day_restrictions'].items() if not enabled] #request.args.get('day_restrictions', default=[], type=json.loads)
    _time_restrictions = request.args.get('time_restrictions', default=[], type=json.loads)

    def stream():
        print('\n', len(codes), codes)
        if not term or not codes:
            yield format_sse(f"Missing parameter(s):{' term' if not term else ''} {' courses' if not codes else ''}", event='error')
            return
        
        ### RETRIEVE COURSE SECTION DATA ###
        start = time.perf_counter()
        full_data = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=2*len(codes)) as executor:
            futures = [(code, executor.submit(get_class_data, term, code)) for code in codes] # Add class data (code .e.g. = ART005)
            try:
                for code, future in futures:
                    for section in future.result():
                        full_data[section['courseReferenceNumber']] = section
            except Exception as e:
                yield format_sse(str(e), event='error')
                return
            futures = [executor.submit(get_course_sections, code, future, _min_seats, _day_restrictions, _time_restrictions) for code, future in futures]
        print('Get Class Data/Course Sections:', time.perf_counter() - start)

        ### GENERATE SECTION PAIRS ###
        start = time.perf_counter_ns()
        section_combinations = []
        error_courses = []
        for future in futures:
            try:
                course_sections = future.result()
                for course in course_sections: #PHYS040A course key
                    section_comb = []
                    for section in course_sections[course]: #1 course section
                        temp = [course_sections[course][section][type] for type in course_sections[course][section]] # List of list of section codes [['58054'], ['62842', '62843'], ['58095', '60520']]
                        section_comb += [x for x in product(*temp)]
                    if _randomize: shuffle(section_comb)
                    section_combinations.append(section_comb)
            except RuntimeError as e:
                error_courses.append(str(e))
        if error_courses:
            yield format_sse(f'Unable to find open sections for {", ".join(error_courses)}', event='error')
            return
        print('Generate Sections:', time.perf_counter_ns() - start)
        
    
        ### CHECK IF TWO SECTIONS IN A SCHEDULE CONFLICT """
        temp11 = []
        start = time.perf_counter()
        valid_schedules = 0
        conflicts = pickle.load(open(f'json/{term}_data/_CONFLICTS.pickle', 'rb'))
        conflicts = frozenset([pair for pair in product([c for d in [a for b in section_combinations for a in b] for c in d], repeat=2) if pair[1] in conflicts[pair[0]]])
        for i in product(*section_combinations):
            conflict = False
            for pair in combinations([j for sub in i for j in sub], 2):
                if pair in conflicts:
                    conflict = True
                    break
            if conflict:
                continue
            if valid_schedules >= _max_schedules:
                break
            valid_schedules += 1
            schedule, crns = {'data':[]}, set()
            for n in [j for sub in i for j in sub]:
                courseData = full_data[n]
                for day in week:
                    if courseData['meetingsFaculty'][0]['meetingTime'][day]:
                        event = {
                            'id': n+day,
                            'start_date': f'{week[day]} {courseData["meetingsFaculty"][0]["meetingTime"]["beginTime"][:2]}:{courseData["meetingsFaculty"][0]["meetingTime"]["beginTime"][2:]}:00',
                            'end_date': f'{week[day]} {courseData["meetingsFaculty"][0]["meetingTime"]["endTime"][:2]}:{courseData["meetingsFaculty"][0]["meetingTime"]["endTime"][2:]}:00',
                            'text': f'{courseData["subject"]}{courseData["courseNumber"]} {courseData["scheduleTypeDescription"]}',
                            'details': ''
                        }
                        crns.add(courseData["courseReferenceNumber"])
                        # crns.add((courseData["subjectCourse"], courseData["courseReferenceNumber"], day))
                        schedule['data'].append(event)
            # temp11.append(list(crns))
            yield format_sse(data=base64.b64encode(gzip.compress(json.dumps([schedule, list(crns)]).encode(), 5)))
            # yield format_sse(data=json.dumps([schedule, crns]))
        print('Schedule Conflicts:', valid_schedules, time.perf_counter() - start)
        # return temp11
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
    crns = set([int(c) for c in request.args['crns'].split(',')])
    found = []
    week = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    print(courses)
    print(crns)
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

    response = make_response(cal.to_ical())
    response.headers["Content-Disposition"] = "attachment; filename=schedule.ics"
    return response
