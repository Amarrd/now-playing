const audioEncoder = require('audio-encoder');
const acrCloud = require('./acrCloud')
const FlowVisualiser = require('./flowVisualiser')
const barVisualiser = require('./barVisualiser')

const testResponse = false; 
//'{"cost_time":1.5520000457764,"metadata":{"music":[{"db_begin_time_offset_ms":55440,"db_end_time_offset_ms":61320,"sample_begin_time_offset_ms":0,"sample_end_time_offset_ms":5880,"play_offset_ms":62160,"title":"Shepherd Song","label":"Ahead Of Our Time","release_date":"2020-07-03","score":100,"acrid":"811e950350d2fd63a32deba6eff0549e","external_ids":{"isrc":"GBCFB2000141","upc":"5054429142426"},"external_metadata":{"spotify":{"track":{"name":"Shepherd Song","id":"76gCm37tYGt1d6z9iC4CHt"},"album":{"name":"Keleketla!","id":"0sqETr5mwDf494FaWzjnGD"},"artists":[{"name":"Keleketla!","id":"7jIuM7cuEe0bBfoNhISVXU"},{"name":"Coldcut","id":"5wnhqlZzXIq8aO9awQO2ND"},{"name":"Tony Allen","id":"6JpZEemWmunccsrHXFUOgi"},{"name":"Nono Nkoane","id":"6U6mRi1Ggv5x8ZMMVkpyUm"},{"name":"Thabang Tabane","id":"2kJc29uqdxbvvH670LozXy"},{"name":"Gally Ngoveni","id":"1E99VOe0iWh1CMVBJ17sf6"},{"name":"Sibusile Xaba","id":"3UZ496XnQSGebDZ8jQqtIJ"},{"name":"Afla Sackey","id":"6HbtkYhKlvY9R1m2PkW6YS"},{"name":"Antibalas","id":"2KGF6IKZfVGCKfyqcNVGfh"}]},"deezer":{"track":{"name":"Shepherd Song","id":"967789912"},"album":{"name":"Keleketla!","id":149758672},"artists":[{"name":"Keleketla!","id":"91445892"},{"name":"Coldcut","id":"3902"},{"name":"Nono Nkoane","id":"8264380"},{"name":"Thabang Tabane","id":"6759669"},{"name":"Tony Allen","id":"665"},{"name":"Gally Ngoveni","id":"68664962"},{"name":"Sibusile Xaba","id":"12237420"},{"name":"Afla Sackey","id":"4717126"},{"name":"Antibalas","id":"63046"},{"name":"Afla Sackey & Afrik Bawantu","id":"6949539"}]}},"result_from":3,"album":{"name":"Keleketla!"},"artists":[{"name":"Tony Allen;Coldcut;Antibalas;Nono Nkoane;Thabang Tabane;Gally Ngoveni;Afla Sackey;Keleketla!;Sibusile Xaba"}],"duration_ms":492000}],"timestamp_utc":"2023-04-02 18:11:40"},"result_type":0,"status":{"msg":"Success","code":0,"version":"1.0"}}'; 
// '{"cost_time":0.70500016212463,"status":{"msg":"Success","version":"1.0","code":0},"metadata":{"timestamp_utc":"2023-03-08 23:04:46","music":[{"artists":[{"name":"Young Fathers"}],"db_begin_time_offset_ms":113240,"db_end_time_offset_ms":117220,"sample_begin_time_offset_ms":0,"acrid":"8f9a903f10da4955f56e60762a456aa4","external_ids":{"isrc":"GBCFB1700586","upc":"5054429132328"},"external_metadata":{"spotify":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"7DuqRin3gs4XTeZ4SwpSVM"}},"deezer":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"450956802"}}},"result_from":3,"album":{"name":"In My View"},"sample_end_time_offset_ms":4660,"score":88,"title":"In My View","label":"Ninja Tune","play_offset_ms":117220,"release_date":"2018-01-18","duration_ms":195220}]},"result_type":0}'
const debugRecording = false;
const visualiserOnly = false;

var autoMode = false;
var audioPromise = navigator.mediaDevices.getUserMedia({ audio: true });
var flowVisualiser; 

function startVisualiser() {
	if (visualiserOnly) {
		document.querySelector('#updateButton').disabled = true;
		document.querySelector('#autoToggleLabel').disabled = true;
	}
	//barVisualiser.main(audioPromise);
	flowVisualiser = new FlowVisualiser.FlowVisualier(audioPromise);
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

	fadeIn('#mic-icon');
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
	if (jsonObject.status.code === 0) {
		var artist = jsonObject.metadata.music[0].artists[0].name.split(';')[0];
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
			setTimeout(() => fadeIn('#current-song'), delay)
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

function canvasClicked() {
	fade('#controls');
	fade('#profiles');
	fade('#credentialsPrompt')
}

document.onkeyup = function (e) {
	if (e.key === "c") {
		fade('#controls');
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
	} else {
		console.log('Element %s could not be faded', elementId)
	}
}

function changeProfile(value) {
	flowVisualiser.changeProfile(value - 1);
}

function changeOption(option) {
	flowVisualiser.changeOption(option, document.querySelector('#' + option).value)
}

function submitCredentials() {
	acrCloud.submitCredentials();
}

function cancelCredentials() {
	acrCloud.cancelCredentials();
}

function saveProfile() {
	flowVisualiser.saveProfile();
}

function resetProfile() {
	flowVisualiser.resetProfile();
}

module.exports = { startVisualiser, updateSong, changeProfile, saveProfile, resetProfile, 
	changeOption, toggleAuto, submitCredentials, cancelCredentials, canvasClicked }
