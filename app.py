import requests
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from lxml import html
import time

from itertools import product, combinations
import json
from random import shuffle
import concurrent.futures

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
    res = requests.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/getEnrollmentInfo?dataType=json&term={term}&courseReferenceNumber={crn}')
    tree = html.fromstring(res.content)
    temp = [int(x) for x in tree.xpath('//span[@dir="ltr"]/text()')]
    print(temp)
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
    codes = request.args['courses'].split(',')
    course_sections = dict()
    times.clear()
    fullData = dict()
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [(code, executor.submit(getClassData, term, code)) for code in codes]
    for _, future in futures:
        print(future.result())
        try:
            print(future.result())
        except Exception as e:
            return Response(str(e), status=400)
            
    for code, future in futures:
        course_data = future.result()
        temp = dict()
        for section in course_data:
            fullData.update({int(section['courseReferenceNumber']): section})
            times.update({int(section['courseReferenceNumber']): section['meetingsFaculty'][0]['meetingTime']})
            type = section['scheduleTypeDescription']
            num = section['linkIdentifier'][1:] if (section['linkIdentifier'][1:]).isnumeric() else 1
            if num not in temp:
                temp.update({num: dict()})
            if type not in temp[num]:
                temp[num].update({type: []})
            
            if not showFull getSeats(term, int(section['courseReferenceNumber'])):#and section['seatsAvailable'] == 0: # give option to make waitlist schedules
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
                    schedule['data'].append(event)
        schedules.append(schedule)
    print(len(schedules))

    shuffle(schedules)
    return jsonify(schedules)
    # return jsonify(json.dumps(schedules, separators=(',', ":")))