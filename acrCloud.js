const crypto = require('crypto');
const FormData = require('form-data');
const options = require('./acrConfig.json');

const clearLocal = true;

function identify(data, cb) {

	const accessKey = localStorage.getItem('accessKey');
	const accessSecret = localStorage.getItem('accessSecret');
	const current_date = new Date();
	const timestamp = current_date.getTime() / 1000;

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
	const audio = new Audio("test.wav")

	identify(audio, function (body, err) {
		if (err) {
			console.log("Error:")
			console.log(err);
			return;
		}
		console.log(body);
		if (JSON.parse(body).status.code === (3001 || 3014)) {
			document.querySelector('#current-song').innerHTML = 'Invalid credentials';
			fadeIn('#current-song');
			setTimeout(() => fadeOut('#current-song'), 3000)
		} else {
			document.body.removeChild(document.querySelector('#credentialsPrompt'))
			document.querySelector('#current-song').innerHTML = 'Credentials saved';
			fadeIn('#current-song');
			setTimeout(() => fadeOut('#current-song'), 3000)
		}

	});
}

function credentialsRequired() {
	if (clearLocal) {
		localStorage.removeItem('accessKey');
		localStorage.removeItem('accessSecret');
		return true;
	}

	let accessKey = localStorage.getItem('accessKey');
	let accessSecret = localStorage.getItem('accessSecret');
	console.log(accessKey + ',' + accessSecret);

	return !accessKey || !accessSecret;
}

function createCredentialsDialogue() {
	let prompt = document.createElement('div');
	let keyInput = document.createElement('input')
	let secretInput = document.createElement('input')
	let submit = document.createElement('button');
	const colour = document.querySelector('#controls').style.color;

	prompt.className = 'credentialsPrompt';
	prompt.id = 'credentialsPrompt';
	prompt.innerHTML = 'Enter ACRCloud credentials';
	prompt.style.color = colour;
	keyInput.id = 'keyInput';
	keyInput.placeholder = 'Access Key';
	keyInput.style.color = colour;
	secretInput.id = 'secretInput';
	secretInput.placeholder = 'Access Secret';
	secretInput.style.color = colour;
	submit.innerHTML = 'Submit';
	submit.id = 'submitCredentials';
	submit.style.color = colour;
	submit.setAttribute('onclick', 'myBundle.submitCredentials()');

	prompt.appendChild(keyInput);
	prompt.appendChild(secretInput);
	prompt.appendChild(submit);
	document.body.appendChild(prompt);
	return;
}

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
	return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
	return crypto.createHmac('sha1', accessSecret)
		.update(Buffer.from(signString, 'utf-8'))
		.digest().toString('base64');
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

module.exports = { identify, credentialsRequired, createCredentialsDialogue, submitConfiguration }