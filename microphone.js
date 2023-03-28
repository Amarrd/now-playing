class Microphone {
    constructor(audioPromise) {
        this.initialised = false;
        audioPromise.then(function (stream) {
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.microphone.connect(this.analyser);
            this.initialised = true;
            this.volumeArray = [];
            this.volumes = [0.1, 0];
            this.intervalCounter = 0;
        }.bind(this)).catch(error => {
            console.log(error);
            alert(error);
        });
    }

    getSamples() {
        this.analyser.getByteFrequencyData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 2;
        let normSamples = [...this.dataArray].map(e => e / conversion - 1);
        return normSamples;
    }

    getVolume() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 2;
        let normSamples = [...this.dataArray].map(e => e / conversion - 1);
        let sum = 0;
        for (let i = 0; i < normSamples.length; i++) {
            sum += normSamples[i] * normSamples[i]
        }
        return Math.sqrt(sum / normSamples.length)
    }

    getSecondAveragedVolume(currentVolume) {
        const interval = 60;
        let sum = 0;
        if (this.intervalCounter < interval) {
            this.volumeArray.push(currentVolume);
        } else {
            this.volumeArray.shift();
            this.volumeArray.push(currentVolume);
        }
        for (let i = 0; i < this.volumeArray.length; i++) {
            sum += this.volumeArray[i];
        }
        this.intervalCounter++;
        return Math.sqrt(sum / this.volumeArray.length)
    }

    getMinAndMaxVolume(currentVolume) {
        const interval = 60;
        if (this.volumeArray.length < interval) {
            this.volumeArray.push(currentVolume);
        } else {
            this.volumeArray.shift();
            this.volumeArray.push(currentVolume);
        }
        for (let i = 0; i < this.volumeArray.length; i++) {
            if (this.volumeArray[i] > this.volumes[1]) {
                this.volumes[1] = this.volumeArray[i];
            };
            if (this.volumeArray[i] < this.volumes[0]) {
                this.volumes[0] = this.volumeArray[i];
            };
        }
        let returnedVolumes = this.volumes;
        if (this.intervalCounter = interval) {
        //    console.log(this.volumes)
            this.intervalCounter = 0;
            this.volumes = [0.1,0];
        }
      //  console.log(returnedVolumes)
        this.intervalCounter++
        return returnedVolumes;
    }
}

module.exports = { Microphone }