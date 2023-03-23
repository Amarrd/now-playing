class Microphone {
    constructor(audioPromise) {
        this.initialised = false;
        audioPromise.then(function(stream) {
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.microphone.connect(this.analyser);
            this.initialised = true;
        }.bind(this)).catch(error => {
            console.log(error);
            alert(error);
        });
    }

    getSamples() {
        this.analyser.getByteFrequencyData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 2;
        let normSamples = [...this.dataArray].map(e => e/conversion - 1);
        return normSamples;
    }

    getVolume() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount/2;
        let normSamples = [...this.dataArray].map(e => e/conversion - 1);
        let sum = 0;
        for (let i = 0; i< normSamples.length; i++){
            sum += normSamples[i] * normSamples[i]
        }
        return Math.sqrt(sum / normSamples.length)
    }
}

module.exports = {Microphone}