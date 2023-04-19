class Microphone {
    constructor(audioPromise) {
        this.initialised = false;
        audioPromise.then(function(stream) {
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

    getSamples() {
        this.analyser.getByteFrequencyData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 2;
        let normSamples = [...this.dataArray].map(e => e/conversion - 1);
        return normSamples;
    }

    getSampleSubArrays(arrayCount, elementModifier) {
        let samples = this.getSamples();
        let arrayLengths = [];
        let sampleArrays = [];
        let priorSplitMin = 0;
        for (let i = 1; i <= arrayCount; i++) {
            arrayLengths.push(i * elementModifier);
        }
        for (let i = 0; i < arrayCount; i++) {
            let splitMin = i === 0 ? 0 : priorSplitMin + arrayLengths[i-1]; 
            let splitMax = splitMin + arrayLengths[i];
            // console.log(`array:${i}, perArray:${arrayLengths[i]}, min:${splitMin}, max:${splitMax}`)
            let subSamples = [];
            for (let j = splitMin; j < splitMax; j++) {
                // console.log(`j:${j}, sample:${samples[j]}`)
                subSamples.push(samples[j]);
            }
            let arrayNumber = i+1;
            let elementsPerArray = arrayNumber * elementModifier; //arrayNumber * ((arrayNumber+1)/2) * elementModifier + arrayNumber;
            // console.log(`samplesBeforeReduction:`)
            // console.log(subSamples);
            sampleArrays.push(this.getAdjustedSamples(subSamples, elementsPerArray));
            priorSplitMin = splitMin;
        }
        return sampleArrays;
    }

    getAdjustedSamples(samples, targetArrayLength) {
      //  console.log(`sample length:${samples.length}, targetLength:${targetArrayLength}`)
        if (samples.length >= targetArrayLength) {
            return this.reduceSamples(samples, targetArrayLength);
        } else {
            return this.interpolateSamples(samples, targetArrayLength); 
        }
    }

    interpolateSamples(samples, targetArrayLength) {
        let multiplyFactor = Math.round(targetArrayLength/samples.length);
        let interpolatedSamples = [];
        for (let i = 0; i < targetArrayLength; i++) {
            let array = Array(multiplyFactor).fill(1 - (Math.abs(samples[i]) || 0))
            interpolatedSamples.push(...array);
        }

        return interpolatedSamples;
    }

    reduceSamples(samples, numberToSplit) {
        let perSplit = Math.floor(samples.length/numberToSplit);
        let reducedSamples = [];
        for (let i = 0; i < numberToSplit; i++) {
            let splitMin = i * perSplit;
            let splitMax = splitMin + perSplit;
            let sum = 0;
            for (let j = splitMin; j < splitMax; j++) {
            //    console.log(samples[j])
                sum += samples[j] * samples[j];
            }
            let result = 1-Math.sqrt(sum/perSplit);
          //  console.log(`splitMin:${splitMin}, splitMax:${splitMax}, sum:${sum}, perSplit:${perSplit}, result:${result}`)
            reducedSamples.push(result);
        }
     //   console.log(reducedSamples);
        return reducedSamples;
    }

    getVolume() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount/4;
        let normSamples = [...this.dataArray].map(e => e/conversion - 0.5);
        let sum = 0;
        for (let i = 0; i< normSamples.length; i++){
            sum += normSamples[i] * normSamples[i]
        }
        let volume = Math.sqrt(sum / normSamples.length);
        let volumeDiff = volume - this.lastVolume;
        let smoothVolume = this.lastVolume + volumeDiff/2;
        this.lastVolume = smoothVolume;
        return smoothVolume;
    }
}

module.exports = {Microphone}