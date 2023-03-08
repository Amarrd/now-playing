var url = require('url');
var fs = require('fs');
var crypto = require('crypto');
var request = require('request');
var buffer = require('buffer');
var FormData = require('form-data');
var WavEncoder = require('wav-encoder');


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

/**
* Identifies a sample of bytes
*/
function identify(data, options, cb) {

	var current_data = new Date();
	var timestamp = current_data.getTime()/1000;

	var stringToSign = buildStringToSign('POST',
		options.endpoint,
		options.access_key,
		options.data_type,
		options.signature_version,
		timestamp);

	var signature = sign(stringToSign, options.access_secret);

	var formData = {
		sample: data,
		access_key:options.access_key,
		data_type:options.data_type,
		signature_version:options.signature_version,
		signature:signature,
		sample_bytes:data.length,
		timestamp:timestamp,
	}
	request.post({
		url: "http://"+options.host + options.endpoint,
		method: 'POST',
		formData: formData
	}, cb);
}

function updateSong() {
	console.log('Request access to microphone');
	navigator.mediaDevices.getUserMedia({ audio: true })
	.then(stream => {
	// Create an instance of MediaRecorder
		const mediaRecorder = new MediaRecorder(stream);

	// Create an array to store the recorded data
		const chunks = [];

		console.log('Started recording')

		mediaRecorder.start();

	// Stop recording after 10 seconds
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

				// Create an audio context
				let audioContext = new AudioContext();
				// Decode the array buffer into an audio buffer
				audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
					// Do something with the audio buffer
					var audioEncoder = require('audio-encoder');
					// Assume you have an AudioBuffer instance called audioBuffer
					audioEncoder(audioBuffer, 'WAV', function(progress) {
					  // Do something with the progress value (0 to 1)
					}, function(blob) {
					  // Do something with the blob (a wav file)
					  var url = URL.createObjectURL(blob);
					  var link = document.createElement("a");
					  link.href = url;
					  link.download = "test.wav";
					  link.click();

					// identify_v2(bufferWav, defaultOptions, function (err, httpResponse, body) {
					// 	if (err) console .log(err);
					// 	console.log(body);
					// });
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