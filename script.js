const audioEncoder = require('audio-encoder');
const acrCloud = require('./acrCloud')
const FlowVisualiser = require('./flowVisualiser')
const CircleVisualiser = require('./circleVisualiser')
const BarVisualiser = require('./barVisualiser')
const utils = require('./utils');

const testResponse = false; //'{"cost_time":0.70500016212463,"status":{"msg":"Success","version":"1.0","code":0},"metadata":{"timestamp_utc":"2023-03-08 23:04:46","music":[{"artists":[{"name":"Young Fathers"}],"db_begin_time_offset_ms":113240,"db_end_time_offset_ms":117220,"sample_begin_time_offset_ms":0,"acrid":"8f9a903f10da4955f56e60762a456aa4","external_ids":{"isrc":"GBCFB1700586","upc":"5054429132328"},"external_metadata":{"spotify":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"7DuqRin3gs4XTeZ4SwpSVM"}},"deezer":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"450956802"}}},"result_from":3,"album":{"name":"In My View"},"sample_end_time_offset_ms":4660,"score":88,"title":"In My View","label":"Ninja Tune","play_offset_ms":117220,"release_date":"2018-01-18","duration_ms":195220}]},"result_type":0}'
const debugRecording = false;

var autoMode = false;
var audioPromise = navigator.mediaDevices.getUserMedia({ audio: true });
var currentVisualiser;
var identifyFunction;
var visualisers = {CircleVisualiser, FlowVisualiser};

function startVisualiser() {
	currentVisualiser =  new CircleVisualiser.CircleVisualiser(audioPromise); //new FlowVisualiser.FlowVisualier(audioPromise); //

	let container = document.querySelector('#controls-container');
	container.style.opacity = 1;
	let height = (window.innerHeight - container.offsetHeight) / 2;
	container.style.top = height + 'px';

	if (acrCloud.credentialsRequired()) {
		document.querySelector('#autoToggle').style.display = 'none';
		document.querySelector('#autoToggleLabel').style.display = 'none';
		document.querySelector('#updateButton').innerHTML = 'Input ACR credentials';
	}
}

function updateSong() {
	if (testResponse) {
		console.log('Using test response');
		processResponse(testResponse);
		return;
	}

	if (acrCloud.credentialsRequired()) {
		acrCloud.createCredentialsDialogue();
		return;
	}

	clearTimeout(identifyFunction);
	fadeIn('#mic-icon');
	console.log('Request access to microphone');
	audioPromise.then(stream => {

		const mediaRecorder = new MediaRecorder(stream);
		const chunks = [];
		console.log('Started recording')
		mediaRecorder.start();
		setTimeout(() => mediaRecorder.stop(), 7100);

		mediaRecorder.addEventListener('dataavailable', event => {
			chunks.push(event.data);
		});

		mediaRecorder.addEventListener('stop', () => {
			console.log('Stopped recording')
			const audioBlob = new Blob(chunks, { type: 'audio/webm' });
			if (debugRecording) {
				saveRecordingToFile(audioBlob, 'beforeEncoding')
			}

			let fileReader = new FileReader();
			let arrayBuffer;
			fileReader.onloadend = () => {
				arrayBuffer = fileReader.result;
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
							fadeOut('#mic-icon')
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
	var delay;
	if (jsonObject.status.code === 0) {
		var artist = jsonObject.metadata.music[0].artists[0].name;
		var title = jsonObject.metadata.music[0].title;
		var album = jsonObject.metadata.music[0].album.name;
		var releaseDate = jsonObject.metadata.music[0].release_date.split('-')[0];
		currentSong.textContent = artist + ' - ' + title;
		albumYear.textContent = album + ', ' + releaseDate;
		albumYear.style.fontStyle = 'italic';
		albumYear.style.fontSize = '28px';
		currentSong.appendChild(albumYear);
		fadeIn('#current-song')
		delay = jsonObject.metadata.music[0].duration_ms - jsonObject.metadata.music[0].play_offset_ms;
		setTimeout(() => fadeOut('#current-song'), delay)
		if (autoMode) {
			delay = delay + 15000;
			console.log('Setting detection delay to ' + delay + 'ms');
			identifyFunction = setTimeout(() => updateSong(), delay);
		} 
	} else {
		if (autoMode) {
			delay = 60000
			fadeOut('#current-song')
			console.log('Not found, setting detection delay to ' + delay + 'ms');
			identifyFunction = setTimeout(() => updateSong(), delay);
		}
	}
}

function saveRecordingToFile(audioBlob, name) {
	var blobUrl = URL.createObjectURL(audioBlob); 
	var a = document.createElement("a"); 
	a.href = blobUrl; 
	a.download = name + ".wav"; 
	a.click(); 
}

function toggleAuto() {
	const autoToggle = document.querySelector('#autoToggle');
	if (autoToggle.checked == true) {
		updateSong();
		autoMode = true;
	} else {
		autoMode = false;
	}
}

function toggleTransition() {
	toggleProfileTransition(currentVisualiser, document.querySelector('#profileTransition').value);
}

function canvasClicked() {
	fade('#controls-container');
	fade('#profiles');
	fade('#credentialsPrompt')
}

document.onkeyup = function (e) {
	if (e.key === "c") {
		fade('#controls-container');
		fade('#profiles');
		fade('#credentialsPrompt')
	}
	if (e.key === "s") {
		fade('#current-song');
	}
}

function fadeIn(elementId) {
	let element = document.querySelector(elementId);
	element.style.transition = 'opacity 0.2s linear 0s';
	element.style.opacity = 1
}

function fadeOut(elementId) {
	let element = document.querySelector(elementId);
	element.style.transition = 'opacity 0.2s linear 0s';
	element.style.opacity = 0
}

function fade(elementId) {
	let element = document.querySelector(elementId);
	if (element) {
		element.style.transition = 'opacity 0.2s linear 0s';
		element.style.opacity = element.style.opacity === '1' ? '0' : '1'
	} 
}

function submitCredentials() {
	acrCloud.submitCredentials();
}

function cancelCredentials() {
	acrCloud.cancelCredentials();
}

function changeProfile(value) {
	utils.changeProfile(currentVisualiser, value - 1);
}

function changeOption(option) {
	utils.changeOption(currentVisualiser, option.id, option.value)
}

function saveProfile() {
	utils.saveProfile(currentVisualiser);
}

function resetProfile() {
	utils.resetProfile(currentVisualiser);
}

module.exports = { startVisualiser, updateSong, changeProfile, saveProfile, toggleTransition, resetProfile, 
	changeOption, toggleAuto, submitCredentials, cancelCredentials, canvasClicked }
