const crypto = require('crypto');
const FormData = require('form-data');
const options = require('./acrConfig.json');

function identify(data, cb) {

	let accessKey = localStorage.getItem('accessKey');
	let accessSecret = localStorage.getItem('accessSecret');

	if (!accessKey || !accessSecret) {
		let prompt = document.createElement('div');
		let keyInput = document.createElement('input')
		let secretInput = document.createElement('input')
		let submit = document.createElement('button');
		prompt.className = 'credentialsPrompt';
		prompt.id = 'credentialsPrompt';
		keyInput.id = 'keyInput';
		secretInput.id = 'secretInput';
		prompt.innerHTML = 'Enter ACRCloud credentials';
		keyInput.placeholder = 'Access Key';
		secretInput.placeholder = 'Access Secret';
		submit.innerHTML = 'Submit';
		submit.id = 'submitCredentials';
		submit.setAttribute('onclick', 'myBundle.submitCredentials()');

		prompt.appendChild(keyInput);
		prompt.appendChild(secretInput);
		prompt.appendChild(submit);
		document.body.appendChild(prompt);
		return;
	}

	console.log(accessKey);
	console.log(accessSecret);

	var current_data = new Date();
	var timestamp = current_data.getTime() / 1000;

	var stringToSign = buildStringToSign('POST',
		options.endpoint,
		accessKey,
		options.data_type,
		options.signature_version,
		timestamp);

	var signature = sign(stringToSign, accessSecret);

	var form = new FormData();
	form.append('sample', data);
	form.append('sample_bytes', data.length);
	form.append('access_key', accessKey);
	form.append('data_type', options.data_type);
	form.append('signature_version', options.signature_version);
	form.append('signature', signature);
	form.append('timestamp', timestamp);

	fetch("https://" + options.host + options.endpoint,
		{ method: 'POST', body: form })
		.then((res) => { return res.text() })
		.then((res) => { cb(res, null) })
		.catch((err) => { cb(null, err) });
}

function submitConfiguration() {
	let accessKey = document.querySelector('#keyInput').value;
	let accessSecret = document.querySelector('#secretInput').value;
	localStorage.setItem('accessKey', accessKey);
	localStorage.setItem('accessSecret', accessSecret);
	document.querySelector('#submitCredentials').innerHTML = 'Testing Credentials';
	document.body.removeChild(document.querySelector('#credentialsPrompt'))
}

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
	return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
	return crypto.createHmac('sha1', accessSecret)
		.update(Buffer.from(signString, 'utf-8'))
		.digest().toString('base64');
}

module.exports = { identify, submitConfiguration}