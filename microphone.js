class Microphone {
    constructor(audioPromise) {
        this.initialised = false;
        audioPromise.then(function (stream) {
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.microphone.connect(this.analyser);
            this.initialised = true;
            this.lastVolume = 0;
        }.bind(this)).catch(error => {
            console.log(error);
            alert(error);
        });
    }

    getVolume() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 4;
        let normSamples = [...this.dataArray].map(e => e / conversion - 0.5);
        let sum = 0;
        for (let i = 0; i < normSamples.length; i++) {
            sum += normSamples[i] * normSamples[i]
        }
        let volume = Math.sqrt(sum / normSamples.length);
        let volumeDiff = volume - this.lastVolume;
        let smoothVolume = this.lastVolume + volumeDiff / 2;
        this.lastVolume = smoothVolume;
        return smoothVolume;
    }

    getSamples() {
        this.analyser.getByteFrequencyData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 2;
        let normSamples = [...this.dataArray].map(e => 1 - Math.abs(e / conversion - 1));
        return normSamples;
    }

    getSamplesFor(targetArrayLength) {
        let normSamples = this.getSamples();
        if (normSamples.length >= targetArrayLength) {
            return normSamples;
        } else {
            return this.interpolateSamples(normSamples, targetArrayLength);
        }
    }

    interpolateSamples(samples, targetArrayLength) {
        let diff = targetArrayLength - samples.length;
        let interpolatedSamples = [];
        for (let i = 0; i < samples.length; i++) {
            if (i < diff) {
                let array = Array(2).fill(samples[i] || 0);
                interpolatedSamples.push(...array);
                array = [];
            } else {
                interpolatedSamples.push(samples[i] || 0);
            }
        }

        return interpolatedSamples;
    }
}

module.exports = { Microphone }