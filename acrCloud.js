const crypto = require('crypto');
const FormData = require('form-data');

var options = {
	host: 'identify-eu-west-1.acrcloud.com',
	endpoint: '/v1/identify',
	signature_version: '1',
	data_type: 'audio',
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

function identify(data, cb) {

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