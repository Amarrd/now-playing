const audioEncoder = require('audio-encoder');
const acrCloud = require('./acrCloud')
const barVisualiser = require('./barVisualiser') 
const flowVisualiser = require('./flowVisualiser')

const testResponse = false; // = '{"cost_time":0.70500016212463,"status":{"msg":"Success","version":"1.0","code":0},"metadata":{"timestamp_utc":"2023-03-08 23:04:46","music":[{"artists":[{"name":"Young Fathers"}],"db_begin_time_offset_ms":113240,"db_end_time_offset_ms":117220,"sample_begin_time_offset_ms":0,"acrid":"8f9a903f10da4955f56e60762a456aa4","external_ids":{"isrc":"GBCFB1700586","upc":"5054429132328"},"external_metadata":{"spotify":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"7DuqRin3gs4XTeZ4SwpSVM"}},"deezer":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"450956802"}}},"result_from":3,"album":{"name":"In My View"},"sample_end_time_offset_ms":4660,"score":88,"title":"In My View","label":"Ninja Tune","play_offset_ms":117220,"release_date":"2018-01-18","duration_ms":195220}]},"result_type":0}'
const debugRecording = false;

var autoMode = false;
var buttonsHidden = false;
var currentSongHidden = false;
var audioPromise = navigator.mediaDevices.getUserMedia({ audio: true });

function startVisualiser() {

	let micIcon = document.getElementById('mic-icon')
	micIcon.style.display = 'none';
	//barVisualiser.main(audioPromise);
	flowVisualiser.main(audioPromise);
}

function updateSong() {
	if (testResponse) {
		console.log('Using test response');
		processResponse(testResponse);
		return;
	}

	addProgressToHtml();
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
	var details = document.createElement('p');
	if (jsonObject.status.code === 0) {
		var artist = jsonObject.metadata.music[0].artists[0].name;
		var title = jsonObject.metadata.music[0].title;
		details.textContent = artist + ' - ' + title;
		if (autoMode) {
			var jsonObject = JSON.parse(response);
			delay = jsonObject.metadata.music[0].duration_ms - jsonObject.metadata.music[0].play_offset_ms + 5000
			console.log('Setting delay to: ' + delay)
			setTimeout(() => updateSong(), delay);
		}
	} else {
		if (autoMode) {
			var delay = 60000
			console.log('Not found, setting delay to: ' + delay)
			setTimeout(() => updateSong(), delay);
		}
	}

	if (currentSong.childNodes.length > 0) {
		currentSong.removeChild(currentSong.childNodes[0])
		currentSong.appendChild(details);
	} else {
		currentSong.appendChild(details);
	}
	let micIcon = document.getElementById('mic-icon')
	micIcon.style.display = 'none';
}

function addProgressToHtml() {
	let micIcon = document.getElementById('mic-icon')
	micIcon.style.display = 'inline';
}

function saveRecordingToFile(audioBlob, name) {
	var blobUrl = URL.createObjectURL(audioBlob); // create a blob URL
	var a = document.createElement("a"); // create an anchor element
	a.href = blobUrl; // set the href attribute to the blob URL
	a.download = name + ".wav"; // set the download attribute to your desired file name
	a.click(); // click the anchor element to trigger the download
}

function toggleAuto() {
	const cb = document.querySelector('#autoToggle');
	let updateButton = document.querySelector('#updateButton');
	console.log(cb.checked);
	if (cb.checked == true) {
		// start auto mode
		autoMode = true;
		updateSong();
		updateButton.style.visibility='hidden'
	} else {
		// stop auto mode
		autoMode = false;
		updateButton.style.visibility='visible'
	}
}

document.onkeyup = function(e) {
	if (e.key === "c") {
		let autoToggle = document.querySelector('#autoToggleLabel');
		let updateButton = document.querySelector('#updateButton');
		if (buttonsHidden) {
			autoToggle.style.visibility = 'visible';
			updateButton.style.visibility = 'visible';
			buttonsHidden = false;
		} else {
			autoToggle.style.visibility = 'hidden';
			updateButton.style.visibility = 'hidden';
			buttonsHidden = true;
		}
	}
	if (e.key === "s") {
		let currentSong = document.querySelector('#current-song');
		if (currentSongHidden) {
			currentSong.style.visibility = 'visible';
			currentSongHidden = false;
		} else {
			currentSong.style.visibility = 'hidden';
			currentSongHidden = true;
		}

	}
}

module.exports = { startVisualiser, updateSong, toggleAuto }