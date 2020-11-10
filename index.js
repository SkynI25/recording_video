let video = document.querySelector('video');
let h1 = document.querySelector('#h1');
function captureCamera(callback) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(camera) {
        callback(camera);
    }).catch(function(error) {
        alert('Unable to capture your camera. Please check console logs.');
        console.error(error);
    });
}
function stopRecordingCallback() {
    video.src = video.srcObject = null;
    video.muted = false;
    video.volume = 1;
    video.src = URL.createObjectURL(recorder.getBlob());
    recorder.destroy();
    recorder = null;
}
let recorder; // globally accessible
let blobs = [];
let speaker = new MediaStream();
document.getElementById('btn-start-recording').onclick = function() {
    this.disabled = true;
    captureCamera(function(camera) {
        navigator.mediaDevices.getDisplayMedia({video: {cursor: "always"}, audio: true}).then(stream => {
            const ac = new AudioContext();
            const audioTracks = [...camera.getAudioTracks(), 
                                ...stream.getAudioTracks()];
            const sources = audioTracks.map(t => ac.createMediaStreamSource(new MediaStream([t])));
            const dest = ac.createMediaStreamDestination();
            sources.forEach(s => s.connect(dest));
            speaker = dest.stream;
            speaker.addTrack(stream.getVideoTracks()[0].clone());
            video.volume = 1;
            video.srcObject = speaker;
            recorder = RecordRTC(speaker, {
                type: 'video/webm'
            });
            recorder = RecordRTC(speaker, {
                type: 'video/webm',
                timeSlice: 1000,
                ondataavailable: function (blob) {
                    blobs.push(blob);
                    console.log(blob);
                    console.log(URL.createObjectURL(blob));
                    var size = 0;
                    blobs.forEach(function (b) {
                        size += b.size;
                    });
                    h1.innerHTML = 'Total blobs: ' + blobs.length + ' (Total size: ' + bytesToSize(size) + ')';
                }
            });
            recorder.startRecording();
            // release camera on stopRecording
            recorder.speaker = speaker;
            document.getElementById('btn-stop-recording').disabled = false;
        });
    });
};
document.getElementById('btn-stop-recording').onclick = function() {
    this.disabled = true;
    recorder.stopRecording(stopRecordingCallback);
};