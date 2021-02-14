import requests
from flask import Flask, request, Response, jsonify, make_response
from flask_cors import CORS
from lxml import html
from icalendar import Calendar, Event

import time
from itertools import product, combinations
import json
from random import shuffle
import concurrent.futures
from datetime import datetime, timedelta

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
times = dict()

def getSeats(term, crn):
    res = requests.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/getEnrollmentInfo?term={term}&courseReferenceNumber={crn}')
    tree = html.fromstring(res.content)
    temp = [int(x) for x in tree.xpath('//span[@dir="ltr"]/text()')]
    # print(temp)
    if not temp or temp[2] <= 0:
        return False
    return True

def getClassData(term, course):
    # s = requests.Session()
    # s.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/term/search?mode=search&dataType=json&term={term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=')
    # parsed_json = s.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_subjectcoursecombo={course}&txt_term={term}&startDatepicker=&endDatepicker=&pageOffset=0&pageMaxSize=999&sortColumn=subjectDescription&sortDirection=asc&[object%20Object]').json()
    # if parsed_json['totalCount'] == 0:
    #     raise Exception(f'No sections found for {course}')
    # return [class_dict for class_dict in parsed_json['data']]
    course_json = json.load(open(f'json/{term}_data.json', 'r'))[course]
    return [course_json[key] for key in course_json]

def IsConflict(crn1, crn2):
    for day in week:
        if times[int(crn1)][day] and times[int(crn2)][day]:
            s1, e1 = int(times[int(crn1)]['beginTime']), int(times[int(crn1)]['endTime'])
            s2, e2 = int(times[int(crn2)]['beginTime']), int(times[int(crn2)]['endTime'])
            if (s1 < e2) and (e1 > s2):
                return True
    return False;

@app.route('/', methods=['GET'])
def home():
    term = request.args['term']
    course = request.args['course']
    start = time.perf_counter()
    try: 
        class_data = getClassData(term, course)
    except Exception as e:
        return Response(str(e), status=400)
    return jsonify(class_data)
    # return jsonify(time.perf_counter() - start)
    
@app.route('/schedules', methods=['GET'])
def schedules():
    term = request.args['term']
    codes = request.args['courses'].split(',')# if ',' in request.args['courses'] else []
    print(len(codes))
    if not term or not codes:
        return Response(f"Missing parameter(s):{' term' if not term else ''} {' courses' if not codes else ''}", status=400)
    course_sections = dict()
    times.clear()
    fullData = dict()
    seats = dict()
    print(codes)
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [(code, executor.submit(getClassData, term, code)) for code in codes]
        coreqs = []
        for _, future in futures:
            for section in future.result():
                coreqs += [f'{section["subject"]}{creq}' for creq in section['coreq'] if f'{section["subject"]}{creq}' not in coreqs and f'{section["subject"]}{creq}' not in codes]
        print(coreqs)
        futures += [(code, executor.submit(getClassData, term, code)) for code in coreqs]

    for _, future in futures:
        # print(future.result())
        try:
            # print(future.result()[0]['subjectCourse'])
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                for crn, future in [(int(section['courseReferenceNumber']), executor.submit(getSeats, term, int(section['courseReferenceNumber']))) for section in future.result()]:
                    seats.update({crn: future.result()})
        except Exception as e:
            return Response(str(e), status=400)

    for code, future in futures:
        course_data = future.result()
        temp = dict()
        for section in course_data:
            fullData.update({int(section['courseReferenceNumber']): section})
            if not section['meetingsFaculty']:
                return Response(f'No specified meeting times for {code}', status=400)
            times.update({int(section['courseReferenceNumber']): section['meetingsFaculty'][0]['meetingTime']})
            type = section['scheduleTypeDescription']
            num = section['linkIdentifier'][1:] if section['linkIdentifier'] and (section['linkIdentifier'][1:]).isnumeric() else 1
            if num not in temp:
                temp.update({num: dict()})
            if type not in temp[num]:
                temp[num].update({type: []})
            
            if not showFull and not seats[int(section['courseReferenceNumber'])]:#and section['seatsAvailable'] == 0: # give option to make waitlist schedules
                continue
            temp[num].update({type: temp[num][type] + [section['courseReferenceNumber']]})
        toDelete = []
        if not showFull:
            for section in temp:
                for type in temp[section]:
                    if(len(temp[section][type]) == 0):
                        toDelete.append(section)
                        break
            for section in toDelete:
                del temp[section]
        if len(temp) != 0:
            course_sections.update({code: temp})
        else:
            return Response(f'Unable to find open sections for {code}', status=400)
        
    sectionCombinations = []
    for course in course_sections: #PHYS040A course key
        section_comb = []
        for section in course_sections[course]: #1 course section
            temp = [course_sections[course][section][type] for type in course_sections[course][section]] # List of list of section codes [['58054'], ['62842', '62843'], ['58095', '60520']]
            section_comb += [x for x in product(*temp)]
        sectionCombinations.append(section_comb);

    allSchedules, validSchedules = [], []
    for i in product(*sectionCombinations):
        allSchedules.append(i)
        conflict = False
        for pair in combinations([j for sub in i for j in sub], 2):
            if IsConflict(*pair):
                conflict = True
                break
        if not conflict:
            validSchedules.append(i)

    schedules = []
    for code in validSchedules:
        schedule = {'data':[]}
        crns = []
        for n in [j for sub in code for j in sub]:
            num = int(n)
            courseData = fullData[num]
            for day in week:
                if courseData['meetingsFaculty'][0]['meetingTime'][day]:
                    event = dict()
                    event.update({'id': str(num)+day})
                    event.update({'start_date': f'{week[day]} {courseData["meetingsFaculty"][0]["meetingTime"]["beginTime"][:2]}:{courseData["meetingsFaculty"][0]["meetingTime"]["beginTime"][2:]}:00'})
                    event.update({'end_date': f'{week[day]} {courseData["meetingsFaculty"][0]["meetingTime"]["endTime"][:2]}:{courseData["meetingsFaculty"][0]["meetingTime"]["endTime"][2:]}:00'})
                    event.update({'text': f'{courseData["subject"]}{courseData["courseNumber"]} {courseData["scheduleTypeDescription"]}'})
                    # '\nCRN: {courseData["courseReferenceNumber"]}\nSeats: {courseData["seatsAvailable"]}/{courseData["maximumEnrollment"]}\n'
                    event.update({'details': ''})
                    crns.append(int(courseData["courseReferenceNumber"]))
                    schedule['data'].append(event)
        schedules.append([schedule, crns])
    print(len(schedules))

    shuffle(schedules)
    return jsonify(schedules)
    # return jsonify(json.dumps(schedules, separators=(',', ":")))

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
    term_data = json.load(open(f'json/{term}_data.json', 'r'))
    for course in courses:
        for crn in crns:
            if crn in term_data[course] and crn not in found:
                data = term_data[course][crn]
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
