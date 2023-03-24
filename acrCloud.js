const crypto = require('crypto');
const FormData = require('form-data');
const options = require('./acrConfig.json');

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
	return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
	return crypto.createHmac('sha1', accessSecret)
		.update(Buffer.from(signString, 'utf-8'))
		.digest().toString('base64');
}

function identify(data, cb) {

	if (!options.access_key || !options.access_secret) {
		alert("Song identification hasn't been configured yet. Coming soon!")
		return;
	}

	var current_data = new Date();
	var timestamp = current_data.getTime() / 1000;

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

	fetch("http://" + options.host + options.endpoint,
		{ method: 'POST', body: form })
		.then((res) => { return res.text() })
		.then((res) => { cb(res, null) })
		.catch((err) => { cb(null, err) });
}

module.exports = {identify}