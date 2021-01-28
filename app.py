from flask import Flask, request
app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    term = request.args['term']
    course = request.args['course']
    return {'hello':term, 'world':course}