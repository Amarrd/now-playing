const audioEncoder = require('audio-encoder');
const acrCloud = require('./acrCloud')
const flowVisualiser = require('./flowVisualiser')
const barVisualiser = require('./barVisualiser')

const testResponse = false; '{"cost_time":0.70500016212463,"status":{"msg":"Success","version":"1.0","code":0},"metadata":{"timestamp_utc":"2023-03-08 23:04:46","music":[{"artists":[{"name":"Young Fathers"}],"db_begin_time_offset_ms":113240,"db_end_time_offset_ms":117220,"sample_begin_time_offset_ms":0,"acrid":"8f9a903f10da4955f56e60762a456aa4","external_ids":{"isrc":"GBCFB1700586","upc":"5054429132328"},"external_metadata":{"spotify":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"7DuqRin3gs4XTeZ4SwpSVM"}},"deezer":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"450956802"}}},"result_from":3,"album":{"name":"In My View"},"sample_end_time_offset_ms":4660,"score":88,"title":"In My View","label":"Ninja Tune","play_offset_ms":117220,"release_date":"2018-01-18","duration_ms":195220}]},"result_type":0}'
const debugRecording = false;

var autoMode = false;
var audioPromise = navigator.mediaDevices.getUserMedia({ audio: true });

function startVisualiser() {
	//barVisualiser.main(audioPromise);
	flowVisualiser.main(audioPromise);
}

function updateSong() {
	if (testResponse) {
		console.log('Using test response');
		processResponse(testResponse);
		return;
	}

	fade('#mic-icon');
	console.log('Request access to microphone');
	audioPromise.then(stream => {

		const mediaRecorder = new MediaRecorder(stream);
		const chunks = [];
		console.log('Started recording')
		mediaRecorder.start();
		setTimeout(() => mediaRecorder.stop(), 7100);

		// Listen for data available event and store the data in chunks
		mediaRecorder.addEventListener('dataavailable', event => {
			chunks.push(event.data);
		});

		// Listen for stop event and create a new audio blob from the recorded data
		mediaRecorder.addEventListener('stop', () => {
			console.log('Stopped recording')
			const audioBlob = new Blob(chunks, { type: 'audio/webm' });
			if (debugRecording) {
				saveRecordingToFile(audioBlob, 'beforeEncoding')
			}
			// Identify track
			// convert blob to buffer
			let fileReader = new FileReader();
			let arrayBuffer;
			fileReader.onloadend = () => { 

				arrayBuffer = fileReader.result;
				// Create an audio context and decode the array buffer into an audio buffer
				let audioContext = new AudioContext();
				audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
					audioEncoder(audioBuffer, 'WAV',
						function (progress) { },
						function (encodedAudio) {
							if (debugRecording) {
								saveRecordingToFile(encodedAudio, 'afterEncoding')
							}
							console.log('Identifying recording')
							acrCloud.identify(encodedAudio, function (body, err) {
								if (err) {
									console.log("Error:")
									console.log(err);
									processResponse(err);
									return;
								}
								console.log("Response:")
								console.log(body);
								processResponse(body)

							});
							fade('#mic-icon')
						});
				});
			}
			fileReader.readAsArrayBuffer(audioBlob)
		});
	}).catch(error => {
		alert(error);
	});
}

function processResponse(response) {
	var jsonObject = JSON.parse(response);
	var currentSong = document.getElementById('current-song');
	var albumYear = document.querySelector('#albumYear');
	if (jsonObject.status.code === 0) {
		var artist = jsonObject.metadata.music[0].artists[0].name;
		var title = jsonObject.metadata.music[0].title;
		var album = jsonObject.metadata.music[0].album.name;
		var releaseDate = jsonObject.metadata.music[0].release_date.split('-')[0];
		currentSong.textContent = artist + ' - ' + title;
		albumYear.textContent = album + ', ' + releaseDate;
		albumYear.style.fontStyle = 'italic';
		albumYear.style.fontSize = '18px';
		currentSong.appendChild(albumYear);
		currentSong.style.transition = 'opacity 0.5s linear 0s';
		currentSong.style.opacity = 1;
		if (autoMode) {
			var jsonObject = JSON.parse(response);
			delay = jsonObject.metadata.music[0].duration_ms - jsonObject.metadata.music[0].play_offset_ms;
			detectDelay = delay + 5000;
			console.log('Setting delay to: ' + detectDelay)
			setTimeout(() => fade('#current-song'), delay)
			setTimeout(() => updateSong(), detectDelay);
		}
	} else {
		if (autoMode) {
			var detectDelay = 60000
			console.log('Not found, setting delay to: ' + detectDelay)
			setTimeout(() => updateSong(), detectDelay);
		}
	}
}

function saveRecordingToFile(audioBlob, name) {
	var blobUrl = URL.createObjectURL(audioBlob); // create a blob URL
	var a = document.createElement("a"); // create an anchor element
	a.href = blobUrl; // set the href attribute to the blob URL
	a.download = name + ".wav"; // set the download attribute to your desired file name
	a.click(); // click the anchor element to trigger the download
}

function toggleAuto() {
	const autoToggle = document.querySelector('#autoToggle');
	let updateButton = document.querySelector('#updateButton');
	if (autoToggle.checked == true) {
		// start auto mode
		updateSong();
		autoMode = true;
		updateButton.style.visibility = 'hidden'
	} else {
		// stop auto mode
		autoMode = false;
		updateButton.style.visibility = 'visible'
	}
}

document.onkeyup = function (e) {
	if (e.key === "c") {
		fade('#controls');
	}
	if (e.key === "s") {
		fade('#current-song');
	}
}

function fade(elementId) {
	let element = document.querySelector(elementId);
	element.style.transition = 'opacity 0.2s linear 0s';
	element.style.opacity = element.style.opacity === '1' ? '0' : '1'}

function hueChange() {
	flowVisualiser.hueChange(Number(document.querySelector('#hue').value));
}

function hueShiftChange() {
	flowVisualiser.hueShiftChange(Number(document.querySelector('#hueShift').value));
}

function volumeChange() {
	flowVisualiser.volumeChange(Number(document.querySelector('#volume').value));
}

function curveChange() {
	flowVisualiser.curveChange(Number(document.querySelector('#curve').value));
}

function zoomChange() {
	flowVisualiser.zoomChange(Number(document.querySelector('#zoom').value));
}

function xAdjustmentChange() {
	flowVisualiser.xAdjustmentChange(Number(document.querySelector('#xAdjustment').value));
}

function yAdjustmentChange() {
	flowVisualiser.yAdjustmentChange(Number(document.querySelector('#yAdjustment').value));
}

function scrollSpeedChange() {
	flowVisualiser.scrollSpeedChange(Number(document.querySelector('#scrollSpeed').value));
}

function toggleBassMode() {
	flowVisualiser.toggleBassMode(document.querySelector('#bassMode').checked);
}

module.exports = { startVisualiser, updateSong, toggleAuto, hueChange, hueShiftChange, volumeChange, 
	curveChange, zoomChange, xAdjustmentChange, yAdjustmentChange, scrollSpeedChange, toggleBassMode }