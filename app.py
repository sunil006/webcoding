from flask import Flask, request, render_template, jsonify
import os
from src import verify_face as vf
from src import face_detect as fd
import base64
import requests

app = Flask(__name__)
app._static_folder = os.path.abspath("templates/static/")



@app.route('/',methods=['GET','POST'])
def imposting():
    return "Hello"

@app.route('/upload',methods=['GET','POST'])
def upload():
    image1= request.form["ID"]
    image2 = request.form["frame"]
    #print(type(image2))
    #convert_and_save(image2)
    image1=base64.decodebytes(image1.encode())
    image2=base64.decodebytes(image2.encode())
    resp=vf.Face_verify(image1,image2)
    return jsonify(resp)
    #return jsonify("OK")
    
@app.route('/head',methods=['GET','POST'])
def head():
    image1= request.form["image"]
    image1=base64.decodebytes(image1.encode())
    resp=fd.headPose(image1)
    return jsonify(resp)


@app.route('/run',methods=['GET','POST'])
def run():
    RUN_URL = u'https://api.hackerearth.com/v3/code/run/'
    CLIENT_SECRET = '2b1517da6ee40243600253315a90b8fbe9d4896f'
    #Hi
    source = request.form['code']
    
    data = {
        'client_secret': CLIENT_SECRET,
        'async': 0,
        'source': source,
        'lang': "PYTHON",
        'time_limit': 5,
        'memory_limit': 262144,
    }

    r = requests.post(RUN_URL, data=data)
    out=r.json()
    return out 


@app.route('/compile',methods=['GET','POST'])
def compile():
    RUN_URL = u'https://api.hackerearth.com/v3/code/compile/'
    CLIENT_SECRET = '2b1517da6ee40243600253315a90b8fbe9d4896f'
    
    source = request.form['code']
    
    data = {
        'client_secret': CLIENT_SECRET,
        'async': 0,
        'source': source,
        'lang': "PYTHON",
        'time_limit': 5,
        'memory_limit': 262144,
    }

    r = requests.post(RUN_URL, data=data)
    out=r.json()
    return out 
