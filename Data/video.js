var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $timeout) {
    $scope.chatflow = "Volvo";
    var botui = new BotUI('my-botui-app');

    var sessionid = "";
    var intent = "welcome";
    var currentstate = "syswelcome";
    var qid = 0;
    var topic = "";
    var usertext = "";
    var audioContext;
    var mediaRecorder;
    var filename = "welcome.wav";
    var resFileName = "";
    var isValidByteStream = false;
    var speechtextorder = [];
    var speechtextordermsgs = [];
    var speechTextReqCount = -1;
    let chunks = [];
    let report = [];
    var repeattext = "";
    var botText = "";
    var userid = localStorage.getItem("UserID");
    var ID = localStorage.getItem("wallpaper");
    var preview = document.getElementById("WebCam");
    var imageCapture;
    var canvas = document.createElement('canvas');
    var headpose;
    headpose = 0;
    //qid = null
    time = new Date();
    end = 0;
    start = 0;
    // localStorage.setItem("session", sessionid);
    //to track the silence start time
    silenceStart = 0;

    //to check is intital recording in progress
    started = false;

    //to check is speech to text processing in progress
    isspeechToTextProcessingCnt = 0;

    //to check is response generation in progres
    isTextResponseGenerating = false;

    //to track the number of questions
    questCnt = 0;

    //to check is exam done
    isExamDone = false;
    isClosing = false;
    miniSilenceStart = 0;

    isparentquestion = 0;

    var isTestEnd = 0;

    var socket = new WebSocket('wss://preptalk-gi-ws.bfmdev1.com:5000/ws');

    socket.onmessage = function (evt) {
        console.log(evt.data)
        console.log(evt.data == '#closed forcefully#')
        if (evt.data != '' && evt.data != null && evt.data != undefined) {
            if (evt.data == '#closed#' || evt.data == '#closed forcefully#') {
                if (mediaRecorder.state != 'inactive') {
                    mediaRecorder.stop();
                }
                silenceStart = 0;
                playAudio();
                isClosing = false;
            }
            else {
                usertext = usertext + '@' + evt.data;
                botui.message.human({
                    content: evt.data,
                    loading: true,
                    photo: '/images/' + localStorage.getItem("userimage"),
                    delay: 200,
                })
            }
        }
    };

    socket.onclose = function (evt) { console.log("Connection close"); };

    socket.onopen = function (evt) {
        console.log('connected');

    };

    function getSessionID() {
        $.ajax({
            url: Url + "get_session_id?userid=" + localStorage.getItem("UserID") + "&channel=voice",
            type: 'GET',
            contentType: false,
            processData: false,
            success: function (res) {
                sessionid = res.sessionid;
                localStorage.setItem("session", sessionid);
                if (res.conver == null || res.conver == undefined || res.conver.length == 0) {
                    playAudio();
                }
                else {
                    setConversations(res.conver)
                }
            }
        })
    }

    function setConversations(conver) {
        var uname = localStorage.getItem("UserName").charAt(0).toUpperCase() + localStorage.getItem("UserName").slice(1);

        if (conver == null || conver == undefined || conver.length == 0) {
            playAudio()
        }
        else {
            for (var i = 0; i < conver.length; i++) {
                qid = conver[i].qid;
                usertext = conver[i].text;

                if (conver[i].question != '' && conver[i].question != null && conver[i].question != undefined) {
                    botui.message.bot({
                        content: conver[i].question,
                        type: 'html',
                        user: "CInDE",
                        loading: true,
                        photo: true,
                        delay: 5
                    })

                    user_text_array = conver[i].text.split('@')

                    for (var j = 0; j < user_text_array.length; j++) {
                        if (user_text_array[j] != '' && user_text_array[j] != null && user_text_array[j] != undefined) {
                            botui.message.human({
                                content: user_text_array[j],
                                user: uname,
                                loading: true,
                                photo: '/images/' + localStorage.getItem("userimage"),
                                delay: 5
                            })
                        }
                    }
                }
            }
            playAudio();
        }
    }

    function setfileName(filename, text, location) {

        if (text == '' || text == undefined || text == null)
            return;
        $('#audSource').attr('src', Url + "get_voice_question_by_filename?filename=" + filename + "&location=" + location + "&sessionid=" + sessionid + "&topic=hiring");
        $('#audSource1').attr('src', 'https://idcblob.blob.core.windows.net/preptalk-gi/' + filename);

        $('#sysAudio').get(0).load();
        $('#sysAudio').get(0).play();

        if (filename != 'repeat.wav') {
            botText = text;
        }
        else {
            repeattext = text;
        }

        $('#startAudio').animate({
            scrollTop: $('#startAudio')[0].scrollHeight
        }, 500);
        currentstate = "userwelcome";
    }

    var vid1 = document.getElementById("sysAudio");

    vid1.onloadeddata = function () {

        if (resFileName == "repeat.wav") {
            botui.message.bot({
                content: repeattext,
                type: 'html',
                user: "CInDE",
                loading: true,
                photo: true,
                delay: 200,
            })
        }
        else {
            botui.message.bot({
                content: botText,
                type: 'html',
                user: "CInDE",
                loading: true,
                photo: true,
                delay: 200,
            })
        }
    };

    vid1.onended = function () {
        if (isparentquestion == 1) {
            playAudio()
            return;
        }


        try {
            socket.send('start');
        }
        catch (e) {
            console.log(e);
            alert('error starting session')
        }
        started = true;
        start = 0;
        end = 0;
        silenceStart = 0;
        isTextResponseGenerating = false;

        mediaRecorder.start();
        
        //mark the system start

    };

    $scope.obey = function test(id) {
        alert("hh");
        $scope.hide = !$scope.hide;
    };

    function playAudio() {

        if (isTestEnd == 1) {

            return;
        }
        speechtextorder = [];
        speechtextordermsgs = [];
        speechTextReqCount = -1
        var data = new FormData();
        data.append('topic', topic);
        data.append('usertext', usertext);
        data.append('qid', qid);
        data.append('currentstate', currentstate);
        data.append('sessionid', sessionid);
        data.append('intent', intent);
        data.append('userid', userid);
        data.append('bottext', botText);
        data.append('isparentquestion', isparentquestion)
        $.ajax({
            url: Url + "get_text_response",
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: function (res) {

                if (res.qid != 0 && res.qid != '' && res.qid != null && res.qid != undefined) {
                    ++questCnt;
                    qid = res.qid;
                }
                isparentquestion = res.isparentquestion;
                usertext = "";
                topic = res.topic;

                isTestEnd = res.istestend

                if (isTestEnd == 1) {
                    isExamDone = true;
                    return;
                }
                resFileName = res.filename;
                setfileName(res.filename, res.question, res.location);
            },
            error: function (xhr, status, error) {
                isTextResponseGenerating = false;

                console.log('error')
                console.log(xhr.responseText)
            }
        });

    }

    function sendfile(blob) {
        ++speechTextReqCount;
        var data = new FormData();
        data.append('audioFile', blob);
        data.append('sessionid', sessionid);
        data.append('intent', intent);
        data.append('currentstate', currentstate);
        data.append('qid', qid);
        data.append('requestno', speechTextReqCount)

        $.ajax({
            url: Url + "get_speech_text",
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: function (data) {
                //OnSpeechToText(data);
            },
            error: function (data) {
                --isspeechToTextProcessingCnt;
                console.log("speech to text error");
            }
        });
    }

    function OnSpeechToText(data) {
        --isspeechToTextProcessingCnt;
        data.requestno = Number(data.requestno);
        var uname = localStorage.getItem("UserName").charAt(0).toUpperCase() + localStorage.getItem("UserName").slice(1);

        //initial request
        if (speechtextorder.length == 0) {
            if (data.requestno != 0) {
                for (var i = 0; i <= data.requestno; i++) {
                    speechtextorder.push(-1)
                    speechtextordermsgs.push("")
                }
                speechtextorder[data.requestno] = 0;
                speechtextordermsgs[data.requestno] = data.text;
                return;
            }
            else {
                speechtextorder.push(1);
                speechtextordermsgs.push(data.text);

                if (data.text != '' && data.text != null && data.text != undefined) {
                    botui.message.human({
                        content: data.text,
                        user: uname,
                        loading: true,
                        photo: '/images/' + localStorage.getItem("userimage"),
                        delay: 200,
                    })
                }
            }
        }
        else {
            // for new requests and 
            if (data.requestno + 1 > speechtextorder.length) {
                for (var i = speechtextorder.length; i < data.requestno + 1; i++) {
                    speechtextorder.push(-1)
                    speechtextordermsgs.push("")
                }
                speechtextorder[data.requestno] = 0;
                speechtextordermsgs[data.requestno] = data.text;

                for (var i = 0; i < speechtextorder.length; i++) {
                    if (speechtextorder[i] == 0) {
                        speechtextorder[i] = 1;

                        if (speechtextordermsgs[i] != '' && speechtextordermsgs[i] != null && speechtextordermsgs[i] != undefined) {
                            botui.message.human({
                                content: speechtextordermsgs[i],
                                user: uname,
                                loading: true,
                                photo: '/images/' + localStorage.getItem("userimage"),
                                delay: 200,
                            })
                        }

                    }
                    else if (speechtextorder[i] == -1) {
                        break;
                    }
                }
            }
            else if (data.requestno + 1 < speechtextorder.length) {
                speechtextorder[data.requestno] = 0
                speechtextordermsgs[data.requestno] = data.text

                for (var i = 0; i < speechtextorder.length; i++) {
                    if (speechtextorder[i] == 0) {
                        speechtextorder[i] = 1;

                        if (speechtextordermsgs[i] != '' && speechtextordermsgs[i] != null && speechtextordermsgs[i] != undefined) {
                            botui.message.human({
                                content: speechtextordermsgs[i],
                                user: uname,
                                loading: true,
                                photo: '/images/' + localStorage.getItem("userimage"),
                                delay: 200,
                            })
                        }

                    }
                    else if (speechtextorder[i] == -1) {
                        break;
                    }
                }

            }
            else if (data.requestno + 1 == speechtextorder.length) {
                speechtextorder[data.requestno] = 0
                speechtextordermsgs[data.requestno] = data.text

                if (data.text != '' && data.text != null && data.text != undefined) {
                    botui.message.human({
                        content: data.text,
                        user: uname,
                        loading: true,
                        photo: '/images/' + localStorage.getItem("userimage"),
                        delay: 200,
                    })
                }
            }
        }

        if (data.text != "") {
            usertext = usertext + '@' + data.text;
        }
        $('#startAudio').animate({
            scrollTop: $('#startAudio')[0].scrollHeight
        }, 500);
    }


    $scope.evaluate = function () {
        isTextResponseGenerating = true;
        isTestEnd = 1;
        $.ajax({
            url: Url + "evaluate?sessionid=" + sessionid,
            type: 'GET',
            contentType: false,
            processData: false,
            success: function (data) {
                var list = {};
                $("#fullaudio").show();
                $scope.playFullAudio();
                localStorage.setItem("session", "");
                //$timeout(function () {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].tscore >= 8)
                        data[i].tclass = "green"
                    else if (data[i].tscore >= 5)
                        data[i].tclass = "orange"
                    else if (data[i].tscore < 5)
                        data[i].tclass = "red"

                    if (data[i].escore >= 8)
                        data[i].eclass = "green"
                    else if (data[i].escore >= 5)
                        data[i].eclass = "orange"
                    else if (data[i].escore < 5)
                        data[i].eclass = "red"


                    if (parseFloat(data[i].escore) + parseFloat(data[i].tscore) >= 16)
                        data[i].teclass = "green"
                    else if (parseFloat(data[i].escore) + parseFloat(data[i].tscore) >= 10)
                        data[i].teclass = "orange"
                    else if (parseFloat(data[i].escore) + parseFloat(data[i].tscore) < 10)
                        data[i].teclass = "red"
                }

                $timeout(function () {
                    $scope.ScoreList = data;
                    if ($scope.ScoreList != null)
                        $("#legends").show();
                });

                $scope.totalTQ = 0;
                $scope.totalEQ = 0;
                for (var i = 0; i < data.length; i++) {
                    $scope.totalTQ = $scope.totalTQ + parseFloat(data[i].tscore);
                    $scope.totalEQ = $scope.totalEQ + parseFloat(data[i].escore);
                }
                $("#micimage").hide();
                $("#assessscore").show();
                $("#report").show();
                $("#analysis").show();

                // alert('evaluated');
                console.log(list)
                stop(preview.srcObject);
            }
        });
    }

    $scope.playFullAudio = function () {
        //$('#simulateSource').attr('src', 'https://pactiadeltacontainer.blob.core.windows.net/delta-questions/' + filename);
        $('#simulateSource').attr('src', Url + "get_voice_question_by_filename?filename=" + sessionid + ".wav&location=blob");
        $('#simulateaudio').get(0).load();
        $('#simulateaudio').get(0).pause();
        console.log(report);
        $scope.videoResult = report;
        
    }

   

    $scope.displaystart = function (selectedtopic) {
        topic = selectedtopic;
        $("#startsimulate").show();
        $("#selecttopic").hide();
        $("#startbutton").hide();
    }

    var convertFloat32ToInt16 = function (buffer) {
        l = buffer.length;
        buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, buffer[l]) * 0x7fff;
        }
        return buf.buffer;
    }

    function stop(stream) {
        //alert("Stoping the Interview");
        stream.getTracks().forEach(track => track.stop());
        
    }

    function checkHeadPose(frameImage) {
        var data = new FormData();
        data.append('image', frameImage);
        $.ajax({
            url: "http://127.0.0.1:5000/head",
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,

            success: function (data) {

                
                if (data['pitch'] >= 15 || data['yaw'] >= 15 || data['roll'] >= 15 || data['pitch'] <= -15 || data['yaw'] <= - 15 || data['roll'] <= -15) {
                    alert("Please look at the camera or else we will terminate the interview.");
                    ++headpose;
                }
                if (headpose == 2) {
                    alert("User is not looking at the camera. So we are terminating the interview. Thanks for considering Pactera EDGE.");
                    $scope.evaluate();
                    
                }
                
            },
            error: function (data) {

                console.log(data);
            }
        });
    }

    function grabFrame() {
        imageCapture.grabFrame()
            .then(function (imageBitmap) {

                console.log('frame:', imageBitmap);
                canvas.width = imageBitmap.width;
                canvas.height = imageBitmap.height;
                canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
                canvas.classList.remove('hidden');
                var data = new FormData();
                
                var base64String = canvas.toDataURL();
                var frameImage = base64String.replace('data:', '').replace(/^.+,/, '');

                data.append('ID', ID);
                data.append('frame', frameImage);
                $.ajax({
                    url: "http://127.0.0.1:5000/upload",
                    type: 'POST',
                    data: data,
                    contentType: false,
                    processData: false,
                    
                    success: function (data) {

                        report.push(data);

                        if (data['isIdentical'] == true) {
                            checkHeadPose(frameImage);
                        }

                        if (data['isIdentical'] == false) {
                            alert("User's face is not matching with the ID provided. So we are terminating the interview. Thanks for considering PacteraEDGE.");
                            $scope.evaluate();
                            
                        }
                    },
                    error: function (data) {
                        
                        console.log(data);
                    }
                });
                
            })
            .catch(function (error) {
                console.log('grabFrame() error: ', error);
            });
        setTimeout(grabFrame, 30000);
    }

    function getVideo(stream,myStream) {
        preview.srcObject = stream;
        preview.captureStream = preview.captureStream || preview.mozCaptureStream;

        const track = myStream.getVideoTracks()[0];
        imageCapture = new ImageCapture(track);
        grabFrame();
        

    }

    $scope.StartAssessment = function () {
        console.log('hai')
        console.log(ID);
        $("#startAudio").show();
        $("#micimage").show();
        $("#startbutton").hide();
        $("#startsimulate").hide()
        $('#startVideo').show()
        
        //  topic = selectedtopic;
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then(function (stream) {
                audioContext = new AudioContext({ sampleRate: 16000 });

                

                getSessionID();

                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;
                
                mediaRecorder = new MediaRecorder(stream);



                var myStream = mediaRecorder.stream;
                
                
                mediaRecorder.ondataavailable = function (e) {
                    chunks = []
                    chunks.push(e.data);

                    //if (isTextResponseGenerating == true)
                    //    return;
                    
                    var blob = new Blob(chunks, { 'type': 'audio/webm; codecs=opus' });
                    var fileReader = new FileReader();
                    fileReader.onload = function (event) {
                        arrayBuffer = event.target.result;
                    };
                    fileReader.readAsArrayBuffer(blob);
                    fileReader.onloadend = function (d) {
                        audioContext.decodeAudioData(
                            fileReader.result,
                            function (buffer) {
                                var wav = audioBufferToWav(buffer);

                                sendfile(new Blob([new Uint8Array(wav)]));
                            },
                            function (e) { console.log(e); }
                        );
                    };
                }

                


                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);
                javascriptNode.onaudioprocess = function (e) {

                    //console.log(Math.round(average));
                    if (silenceStart > 0) {
                        time = new Date();
                        silenceend = time.getTime()

                        if (Math.abs(silenceStart - silenceend) / 1000 >= 3) {
                            try {
                                isTextResponseGenerating = true;
                                isValidByteStream = false;
                                if (isClosing == false) {
                                    if (mediaRecorder.state != 'inactive') {
                                        mediaRecorder.stop();
                                    }
                                    socket.send("close");
                                    isClosing = true;
                                }


                            }
                            catch (e) {
                                alert('error closing stream')
                            }
                            //if (isspeechToTextProcessingCnt <= 0) {

                            //    silenceStart = 0;
                            //    playAudio();
                            //}
                            return;
                        }
                    }

                    if (started == true && isTextResponseGenerating == false) {
                        var array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);
                        var values = 0;

                        var length = array.length;
                        for (var i = 0; i < length; i++) {
                            values += (array[i]);
                        }

                        var average = values / length;



                        if (Math.round(average) > 20 && start == 0) {
                            isValidByteStream = true;
                            time = new Date();
                            start = time.getTime()
                            silenceStart = 0;
                        }
                        else if (start > 0 && Math.round(average) <= 20) {
                            isValidByteStream = false;
                            time = new Date();
                            end = time.getTime()
                            ++isspeechToTextProcessingCnt;
                            start = 0;
                            silenceStart = end;
                            end = 0
                        }

                        if (isValidByteStream === true && isTextResponseGenerating == false) {
                            //console.log(convertFloat32ToInt16(e.inputBuffer.getChannelData(0)));
                            //socket.send(JSON.stringify({ 'data': convertFloat32ToInt16(e.inputBuffer.getChannelData(0)), 'end': true }));
                            socket.send(convertFloat32ToInt16(e.inputBuffer.getChannelData(0)));
                            //socket.send(e.inputBuffer.getChannelData(0));
                            //console.log(new Uint8Array(e.inputBuffer.getChannelData(0)));
                            //socket.send(new Uint8Array(e.inputBuffer.getChannelData(0)));
                        }
                        else if (isTextResponseGenerating === true) {

                            if (isClosing == false) {
                                if (mediaRecorder.state != 'inactive') {
                                    mediaRecorder.stop();
                                }

                                isValidByteStream = false;

                                socket.send("close");
                                isClosing = true;
                            }

                        }

                    }
                }
                //showing video in PrepTalk
                getVideo(stream, myStream);

            })
            .catch(function (err) {
            });

    }
});
