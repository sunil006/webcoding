import cv2
import math,time
from .verify_face import Face_verify
import numpy as np

def frames():

    videoFile = "C:/Users/banoth.sunil/Documents/WebCam/Video/sample.mp4"
    vidcap = cv2.VideoCapture(videoFile)
    count = 0
    success = True
    fps = int(vidcap.get(cv2.CAP_PROP_FPS))
    im_path="C:/Users/banoth.sunil/Documents/WebCam/Images/"
    while success:
        success,image = vidcap.read()
        #nparr = np.fromstring(image, np.uint8)
        #image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if count%300 == 0 :
            cv2.imwrite(im_path+'frame%d.jpg'%count,image)
            if count==0:
                base_image=im_path+'frame0.jpg'
            ref_image=im_path+'frame%d.jpg'%count
            res=Face_verify(base_image,ref_image)
            print(count,res)
            if res=='false':
                cheat="The candidate is cheating."
                break
        count+=1
    cheat="Everything is fine. The candidate has not cheated."
    return cheat
    
#print(frames())