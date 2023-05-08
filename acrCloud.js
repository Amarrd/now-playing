const crypto = require('crypto');
const FormData = require('form-data');
const options = require('./acrConfig.json');

const clearLocal = false;

function credentialsRequired() {
	if (clearLocal) {
		localStorage.removeItem('accessKey');
		localStorage.removeItem('accessSecret');
		return true;
	}

	let accessKey = localStorage.getItem('accessKey');
	let accessSecret = localStorage.getItem('accessSecret');

	return !accessKey || !accessSecret;
}

function createCredentialsDialogue() {
	let prompt = document.createElement('div');
	let keyInput = document.createElement('input');
	let secretInput = document.createElement('input');
	let buttons = document.createElement('div');
	let submit = document.createElement('button');
	let cancel = document.createElement('button');
	let blockingDiv = document.createElement('div');
	let title = document.createElement('h4');
	const colour = document.querySelector('#controls').style.color;

	blockingDiv.id = 'blockingDiv';
	blockingDiv.className = 'blockingDiv';
	document.body.appendChild(blockingDiv);

	prompt.className = 'credentialsPrompt';
	prompt.id = 'credentialsPrompt';
	prompt.style.color = colour;
	prompt.style.opacity = 1
	title.innerHTML = 'Enter ACRCloud Credentials';
	title.style.textAlign = 'center';
	keyInput.id = 'keyInput';
	keyInput.placeholder = 'Access Key';
	keyInput.style.color = colour;
	secretInput.id = 'secretInput';
	secretInput.placeholder = 'Access Secret';
	secretInput.style.color = colour;
	buttons.className = 'credentialsButtons'
	submit.innerHTML = 'Submit';
	submit.id = 'submitCredentials';
	submit.style.color = colour;
	submit.setAttribute('onclick', 'myBundle.submitCredentials()');
	cancel.innerHTML = 'Cancel';
	cancel.id = 'cancelCredentials';
	cancel.style.color = colour;
	cancel.setAttribute('onclick', 'myBundle.cancelCredentials()');

	buttons.appendChild(submit);
	buttons.appendChild(cancel);
	prompt.appendChild(title);
	prompt.appendChild(document.createElement('br'));
	prompt.appendChild(keyInput);
	prompt.appendChild(secretInput);
	prompt.appendChild(buttons);
	document.body.appendChild(prompt);

	let height = (window.innerHeight - prompt.offsetHeight) / 2;
	let width = (window.innerWidth - prompt.offsetWidth) / 2;
	prompt.style.top = height + 'px';
	prompt.style.left = width + 'px';
	return;
}

function submitCredentials() {
	let accessKey = document.querySelector('#keyInput').value;
	let accessSecret = document.querySelector('#secretInput').value;
	localStorage.setItem('accessKey', accessKey);
	localStorage.setItem('accessSecret', accessSecret);
	const audio = new Audio("test.wav")

	identify(audio, function (body, err) {
		let colour = document.querySelector('#current-song').style.color;
		if (err) {
			console.log("Error:")
			console.log(err);
			localStorage.removeItem('accessKey', accessKey);
			localStorage.removeItem('accessSecret', accessSecret);
			addSnackbar('Error checking credentials', colour);
			return;
		}
		console.log(body);
		if (JSON.parse(body).status.code === (3001 || 3014)) {
			localStorage.removeItem('accessKey', accessKey);
			localStorage.removeItem('accessSecret', accessSecret);
			addSnackbar('Invalid credentials', colour);
		} else {
			document.body.removeChild(document.querySelector('#credentialsPrompt'));
			document.body.removeChild(document.querySelector('#blockingDiv'));
			document.querySelector('#autoToggle').style.display = 'inline';
			document.querySelector('#autoToggleLabel').style.display = 'inline';
			document.querySelector('#updateButton').innerHTML = 'identify song';
			addSnackbar('Credentials saved', colour);
		}

	});
}

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

function addSnackbar(text, colour) {
	var snackbar = document.getElementById("snackbar");
	snackbar.innerHTML = text;
	snackbar.style.color = colour;
	snackbar.className = "show";
	setTimeout(function () { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

function cancelCredentials() {
	document.body.removeChild(document.querySelector('#credentialsPrompt'));
	document.body.removeChild(document.querySelector('#blockingDiv'));
}

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
	return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
	return crypto.createHmac('sha1', accessSecret)
		.update(Buffer.from(signString, 'utf-8'))
		.digest().toString('base64');
}

module.exports = { identify, credentialsRequired, cancelCredentials, createCredentialsDialogue, submitCredentials }