var url = require('url');
var fs = require('fs');
var crypto = require('crypto');
var request = require('request');
var buffer = require('buffer');
var FormData = require('form-data');
var audioEncoder = require('audio-encoder');

const testResponse = false;// = '{"cost_time":0.70500016212463,"status":{"msg":"Success","version":"1.0","code":0},"metadata":{"timestamp_utc":"2023-03-08 23:04:46","music":[{"artists":[{"name":"Young Fathers"}],"db_begin_time_offset_ms":113240,"db_end_time_offset_ms":117220,"sample_begin_time_offset_ms":0,"acrid":"8f9a903f10da4955f56e60762a456aa4","external_ids":{"isrc":"GBCFB1700586","upc":"5054429132328"},"external_metadata":{"spotify":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"7DuqRin3gs4XTeZ4SwpSVM"}},"deezer":{"artists":[{"name":"Young Fathers"}],"album":{"name":"In My View"},"track":{"name":"In My View","id":"450956802"}}},"result_from":3,"album":{"name":"In My View"},"sample_end_time_offset_ms":4660,"score":88,"title":"In My View","label":"Ninja Tune","play_offset_ms":117220,"release_date":"2018-01-18","duration_ms":195220}]},"result_type":0}'

var audioPromise = navigator.mediaDevices.getUserMedia({ audio: true });

var defaultOptions = {
	host: 'identify-eu-west-1.acrcloud.com',
	endpoint: '/v1/identify',
	signature_version: '1',
	data_type:'audio',
	secure: true,
	access_key: 'a5aa8a35f41a9bd996a355421abd87e9',
	access_secret: 'qwBIddOHDLy3tYXijszsv5bfjLCS2lT0blHJtPh7'
};

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
	return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
	return crypto.createHmac('sha1', accessSecret)
	.update(Buffer.from(signString, 'utf-8'))
	.digest().toString('base64');
}

function identify_v2(data, options, cb) {

	var current_data = new Date();
	var timestamp = current_data.getTime()/1000;

	var stringToSign = buildStringToSign('POST',
		options.endpoint,
		options.access_key,
		options.data_type,
		options.signature_version,
		timestamp);

	var signature = sign(stringToSign, options.access_secret);

	var form = new FormData();
	form.append('sample', data);
	form.append('sample_bytes', data.length);
	form.append('access_key', options.access_key);
	form.append('data_type', options.data_type);
	form.append('signature_version', options.signature_version);
	form.append('signature', signature);
	form.append('timestamp', timestamp);

	fetch("http://"+options.host + options.endpoint, 
		{method: 'POST', body: form })
	.then((res) => {return res.text()})
	.then((res) => {cb(res, null)})
	.catch((err) => {cb(null, err)});
}


function addResultToHtml(response) {
	var jsonObject = JSON.parse(response);
	var currentSong = document.getElementById('current-song');
	var details = document.createElement('p');
	if (jsonObject.status.code === 1001) {
		details.textContent = 'Not Found'
		
	} else {
		var artist = jsonObject.metadata.music[0].artists[0].name;
		var title = jsonObject.metadata.music[0].title;
		details.textContent = artist + ' - ' + title;
	}
	
	if (currentSong.childNodes.length > 0 ) {
		currentSong.removeChild(currentSong.childNodes[0])
		currentSong.appendChild(details);
	} else {
		currentSong.appendChild(details);
	}
}

function addInProgressToHtml() {
	var currentSong = document.getElementById('current-song');
	var details = document.createElement('p');
	details.textContent = 'Identifying Song'
	if (currentSong.childNodes.length > 0 ) {
		currentSong.removeChild(currentSong.childNodes[0])
		currentSong.appendChild(details);
	} else {
		currentSong.appendChild(details);
	}
}

function updateSong() {
	if (testResponse) {
		console.log('Using test response');
		addResultToHtml(testResponse);
		return;
	}

	addInProgressToHtml();
	console.log('Request access to microphone');

	//navigator.mediaDevices.getUserMedia({ audio: true }).then(
	audioPromise.then(
	stream => {

		const mediaRecorder = new MediaRecorder(stream);
		const chunks = [];
		console.log('Started recording')
		mediaRecorder.start();
		setTimeout(() => {
			mediaRecorder.stop();
		}, 5000);

	// Listen for data available event and store the data in chunks
		mediaRecorder.addEventListener('dataavailable', event => {
			chunks.push(event.data);
		});

	// Listen for stop event and create a new audio blob from the recorded data
		mediaRecorder.addEventListener('stop', () => {
			console.log('Stopped recording')
			const audioBlob = new Blob(chunks, { type: 'audio/webm' });

		// convert blob to buffer
			let fileReader = new FileReader();
			let arrayBuffer;
			fileReader.onloadend = () => {

				arrayBuffer = fileReader.result;
				// Create an audio context and decode the array buffer into an audio buffer
				let audioContext = new AudioContext();
				audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
					var audioEncoder = require('audio-encoder');
					audioEncoder(audioBuffer, 'WAV', 
					function(progress) {}, 
					function(encodedAudio) {
					// Identify track
					console.log('Identifying recording')
					identify_v2(encodedAudio, defaultOptions, function (err, httpResponse, body) {
						if (err) {
							console.log(err);
							addResultToHtml(err);
							return;
						}
						console.log(body);
						addResultToHtml(body)

					});
					});
				});
			}

			fileReader.readAsArrayBuffer(audioBlob)
			

		});
	})
	.catch(error => {
		console.error(error);
	});

}

navigator.mediaDevices.enumerateDevices()
.then(deviceInfos => {

	for (var i = deviceInfos.length - 1; i >= 0; i--) {
		console.log(deviceInfos[i]);
	}

})

module.exports = {updateSong}