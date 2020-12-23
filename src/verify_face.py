import json, os, requests
from .face_detect import Face_detect

def Config():
    subscription_key ='df1da1e0cc834b5890a4b608724a5b46'
    assert subscription_key

    face_api_url ='https://preptalk-webcam.cognitiveservices.azure.com/face/v1.0/verify'
    headers = {'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': subscription_key}

    params = {
        'detectionModel': 'detection_01',
        'returnFaceAttributes': 'age',
        'returnFaceId': 'true'
    }
    return face_api_url,params,headers
    
def Face_verify(image1,image2):
    
    
   #image1=open(image1,"rb")
    #image2=open(image2,"rb")
    
    faceId1=Face_detect(image1)
    faceId2=Face_detect(image2)
    data={
        'faceId1':faceId1,
        'faceId2':faceId2
        }
    face_api_url,params,headers=Config()
    response = requests.post(face_api_url, params=params,
                             headers=headers, json=data)
                             
    result= response.json()
    return result

#image1=os.path.join('C:/Users/banoth.sunil/Documents/WebCam/Data/pan_card.jpeg')
#image2=os.path.join('C:/Users/banoth.sunil/Documents/WebCam/Data/download.png')
#print(Face_verify(image1,image2))