import requests
from flask import Flask, request
app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    term = request.args['term']
    course = request.args['course']

    s = requests.Session()
    s.get(f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/term/search?mode=search&dataType=json'
            f'&term={term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=')
    jsonurl = f'https://registrationssb.ucr.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?' \
                f'txt_subjectcoursecombo={course}&txt_term={term}&startDatepicker=&endDatepicker=' \
                f'&pageOffset=0&pageMaxSize=999&sortColumn=subjectDescription&sortDirection=asc&[object%20Object]'
    parsed_json = s.get(jsonurl).json()
    class_data = [class_dict for class_dict in parsed_json['data']]
    return class_data

    # return {'hello':term, 'world':course}