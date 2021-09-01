import requests
from flask import Flask, request, Response, jsonify, make_response
from flask_cors import CORS
from lxml import html
from icalendar import Calendar, Event

import gzip
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

def get_seats(term, crn, session):
    # return True
    res = session.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/getEnrollmentInfo?term={term}&courseReferenceNumber={crn}')
    tree = html.fromstring(res.content)

    temp = [int(x) for x in tree.xpath('//span[@dir="ltr"]/text()')]
    """
    Enrollment Actual: 0
    Enrollment Maximum: 10
    Enrollment Seats Available (may have been offered to students on the waitlist or are reserved for specific populations): 10
    Waitlist Capacity: 0
    Waitlist Actual: 0
    Waitlist Seats Available: 0
    """
    # print(temp) 
    if not temp or temp[2] <= 0: ### TODO RETURN BACK TO NORMAL
        return False
    return True

def get_class_data(term, course, map):
    # s = requests.Session()
    # s.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/term/search?mode=search&dataType=json&term={term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=')
    # parsed_json = s.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_subjectcoursecombo={course}&txt_term={term}&startDatepicker=&endDatepicker=&pageOffset=0&pageMaxSize=999&sortColumn=subjectDescription&sortDirection=asc&[object%20Object]').json()
    # if parsed_json['totalCount'] == 0:
    #     raise Exception(f'No sections found for {course}')
    # return [class_dict for class_dict in parsed_json['data']]
    # course_json = json.load(open(f'json/{term}_data.json', 'r'))[course]
    # course_json = pickle.load(open(f'json/{term}_data.pickle', 'rb'))[course]

    # course_json = pickle.load(open(f'json/{term}_data/{course}.pickle', 'rb'))
    course_json = pickle.load(open(f'json/{term}_data/{map[course]}.pickle', 'rb'))[course]
    return [course_json[key] for key in course_json]

# def is_conflict(crn1, crn2, times):
#     for day in week:
#         if times[crn1][day] and times[crn2][day]:
#             s1, e1 = int(times[crn1]['beginTime']), int(times[crn1]['endTime'])
#             s2, e2 = int(times[crn2]['beginTime']), int(times[crn2]['endTime'])
#             if (s1 < e2) and (e1 > s2):
#                 return True
#     return False

# @app.route('/', methods=['GET'])
# def home():
    # term = request.args['term']
    # course = request.args['course']
    # try: 
        # class_data = get_class_data(term, course)
    # except Exception as e:
        # return Response(str(e), status=400)
    # return jsonify(class_data)
    # num = request.args['num']
    # with Proxy("PYRO:TestAPI@localhost:9999") as serv:
    #     return str(serv.test(int(num)))
    
def get_course_sections(code, future, full_data, times, term, course_sections, seats):
    """
    code: READ -- e.g. ECON002, ANTH001
    future: READ --
    full_data: UPDATE --
    times: UNUSED
    term: UNUSED
    course_sections: UPDATE --
    seats: READ -- {'53609': True, '53610': False}
    """
    s = time.perf_counter()
    temp = dict()
    for section in future.result():
        # if section['meetingsFaculty'][0]['meetingTime']['friday'] or int(section['meetingsFaculty'][0]['meetingTime']['beginTime']) < 1200: #todo fix filtering times
        #     continue
        if not section['meetingsFaculty']:
            return Response(f'No specified meeting times for {code}', status=400)
        full_data[section['courseReferenceNumber']] = section
        # times[section['courseReferenceNumber']] = section['meetingsFaculty'][0]['meetingTime']
        
        num = section['linkIdentifier'][1:] if section['linkIdentifier'] and (section['linkIdentifier'][1:]).isnumeric() else 1
        temp[num] = temp.get(num, dict())
        type = section['scheduleTypeDescription']
        temp[num][type] = temp[num].get(type, [])

        if not showFull and not seats[section['courseReferenceNumber']]:#and section['seatsAvailable'] == 0: # give option to make waitlist schedules
        # if not showFull and not get_seats(term, section['courseReferenceNumber']):
            continue
        temp[num][type] = temp[num][type] + [section['courseReferenceNumber']]
    toDelete = set()
    for section in temp:
        for type in temp[section]:
            if(len(temp[section][type]) == 0):
                toDelete.add(section)
                break
                
    for section in toDelete:
        del temp[section]
    if len(temp) != 0:
        course_sections[code] = temp
    else:
        return Response(f'Unable to find open sections for {code}', status=400)
    
@app.route('/schedules', methods=['GET'])
def schedules():
    # times = dict()
    course_sections, full_data = dict(), dict()
    term = request.args['term']
    codes = request.args['courses'].split(',')
    print('\n', len(codes), end=": ")
    if not term or not codes:
        return Response(f"Missing parameter(s):{' term' if not term else ''} {' courses' if not codes else ''}", status=400)
    print(codes)
    
    ### RETRIEVE COURSE SECTION DATA ###
    start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2*len(codes)) as executor:
        map = pickle.load(open(f'json/{term}_data/_map.pickle', 'rb'))
        futures = [(code, executor.submit(get_class_data, term, code, map)) for code in codes] # Add class data
        coreqs = []
        for _, future in futures: # Add coreq to codes list
            for section in future.result():
                coreqs += [f'{section["subject"]}{creq}' for creq in section['coreq'] if f'{section["subject"]}{creq}' not in coreqs and f'{section["subject"]}{creq}' not in codes]
        futures += [(code, executor.submit(get_class_data, term, code, map)) for code in coreqs] # Add coreq class data
        print('Get Class Data/Course Sections:', time.perf_counter() - start)
        start = time.perf_counter()
        session = requests.session()
        seats = {}
        for _, future in futures: # Update seat info
            try:
                for crn, future in [(section['courseReferenceNumber'], executor.submit(get_seats, term, section['courseReferenceNumber'], session)) for section in future.result()]:
                    seats[crn] = future.result()
            except Exception as e:
                return Response(str(e), status=400)
        for code, future in futures:
            executor.submit(get_course_sections, code, future, full_data, [], term, course_sections, seats)
    print('Update Seat Info:', time.perf_counter() - start)

    ### GENERATE SECTION PAIRS ###
    start = time.perf_counter()
    section_combinations = []
    for course in course_sections: #PHYS040A course key
        section_comb = []
        for section in course_sections[course]: #1 course section
            temp = [course_sections[course][section][type] for type in course_sections[course][section]] # List of list of section codes [['58054'], ['62842', '62843'], ['58095', '60520']]
            section_comb += [x for x in product(*temp)]
        # shuffle(section_comb) #Used when excess sections are truncated in next step
        section_combinations.append(section_comb)
    ### REMOVE EXCESS SECTIONS ###
    # To reduce the total number of "possible" schedules
    # sc_lengths = [len(x) for x in section_combinations]
    # print('Section Lengths|Total:', sc_lengths, prod(sc_lengths), end='\t')
    # while prod(sc_lengths) > 350000*5:  # 5 seconds
    #     section_combinations[sc_lengths.index(max(sc_lengths))].pop()
    #     sc_lengths = [len(x) for x in section_combinations]
    # print(sc_lengths, prod(sc_lengths))
    # print('Gen Section Pairs:', time.perf_counter() - start)
    import base64
    ### CHECK IF TWO SECTIONS IN A SCHEDULE CONFLICT """
    def stream():
        start = time.perf_counter()
        valid_schedules = 0
        conflicts = pickle.load(open(f'json/{term}_data/_conflicts.pickle', 'rb'))
        conflicts = frozenset([pair for pair in product([c for d in [a for b in section_combinations for a in b] for c in d], repeat=2) if pair[1] in conflicts[pair[0]]])
        for i in product(*section_combinations): #350000 schedules / sec
            conflict = False
            for pair in combinations([j for sub in i for j in sub], 2):
                if pair in conflicts:
                    conflict = True
                    break
            if conflict:
                continue
            if valid_schedules > 1000:
                break
            valid_schedules += 1
            schedule, crns = {'data':[]}, []
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
                        crns.append(courseData["courseReferenceNumber"])
                        schedule['data'].append(event)
            yield format_sse(data=base64.b64encode(gzip.compress(json.dumps([schedule, crns]).encode(), 5)))
            # yield format_sse(data=json.dumps([schedule, crns]))
        print('Schedule Conflicts:', valid_schedules, time.perf_counter() - start)
        yield format_sse(data='', event='stream-end')
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
    crns = set(request.args['crns'].split(','))
    found = []
    week = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    print(courses)
    print(crns)
    time_format = '%m/%d/%Y-%H%M'
    cal = Calendar()
    map = pickle.load(open(f'json/{term}_data/_map.pickle', 'rb'))
    for course in courses:
        for crn in crns:
            if crn in map[course] and crn not in found:
                data = pickle.load(open(f'json/{term}_data/{map[course]}.pickle', 'rb'))[course][crn]
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
