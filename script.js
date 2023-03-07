navigator.mediaDevices.enumerateDevices()
	.then(deviceInfos => {

		for (var i = deviceInfos.length - 1; i >= 0; i--) {
			console.log(deviceInfos[i]);
		}

	})

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

			// Create a new audio element and set the src to the blob URL
			const audioElement = new Audio(URL.createObjectURL(audioBlob));

			// Play the audio
			console.log('Playing recording')
			audioElement.play();
		});
	})
	.catch(error => {
		console.error(error);
	});

}