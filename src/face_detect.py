import json, os
import requests

#from verify_face import Face_verify
def Config():
    subscription_key ='df1da1e0cc834b5890a4b608724a5b46'
    assert subscription_key

    face_api_url ='https://preptalk-webcam.cognitiveservices.azure.com/face/v1.0/detect'
    headers = {'Content-Type': 'application/octet-stream','Ocp-Apim-Subscription-Key': subscription_key}

    params = {
        'detectionModel': 'detection_01',
        'returnFaceAttributes': 'age,gender,headPose,emotion',
        'returnFaceId': 'true'
    }
    return face_api_url,params,headers

def Face_detect(image):
    
    face_api_url,params,headers=Config()
    response = requests.post(face_api_url, params=params,
                             headers=headers, data=image)
                             
    result= response.json()
    #gender=result[0]['faceAttributes']['gender']
    #emotion=result[0]['faceAttributes']['emotion']
    #current_emotion= max(emotion.items(),key=lambda k: k[1])
    #print(current_emotion[0])
    return result[0]['faceId']

def headPose(image):
    face_api_url,params,headers=Config()
    response = requests.post(face_api_url, params=params,
                             headers=headers, data=image)
                             
    result= response.json()
    #gender=result[0]['faceAttributes']['gender']
    #emotion=result[0]['faceAttributes']['emotion']
    #current_emotion= max(emotion.items(),key=lambda k: k[1])
    #print(current_emotion[0])
    return result[0]['faceAttributes']['headPose']

#image_path=os.path.join('C:/Users/banoth.sunil/Documents/WebCam/Images/frame0.jpg')
#image=open(image_path,"rb")    
#print(Face_detect(image))

