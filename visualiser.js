class Microphone {
    constructor(audioPromise) {
        this.initialised = false;
        audioPromise.then(stream => {
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.microphone.connect(this.analyser);
            this.initialised = true;
        }).catch(error => {
            console.log(error);
            alert(error);
        });
    }

    getSamples() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        let conversion = this.analyser.frequencyBinCount / 2;
        let normSamples = [...this.dataArray].map(e => e/conversion - 1);
        return normSamples;
    }

    getVolume() {
        let samples = this.getSamples();
        let sum = 0;
        for (let i = 0; i< samples.length; i++){
            sum += samples[i] * samples[i]
        }
        return Math.sqrt(sum / samples.length)
    }
}

class Bar {
    constructor(x , y, width, height, colour) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height;
    this.colour = colour;
    }

    update(micInput) {
        const sound = micInput * 500;
        if (sound > this.height) {
            this.height = sound;
        } else {
            this.height -= this.height * 0.01
        }
        
    }
    
    draw(context) {
        // context.fillStyle = this.colour;
        // context.fillRect(this.x, this.y, this.width, this.height);

        context.strokeStyle = this.colour;
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(this.x, this.y - this.height);
        context.stroke();

        // context.moveTo(this.x, this.y);
        // context.lineTo(this.x, window.innerHeight/2 + this.height);
    }
}


function main(audioPromise) {
    const canvas =  document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //ctx.rotate(Math.PI);


    function createBars() {
        let canvasMidX = canvas.width/ 2;
        let canvasMidY = canvas.height * 0.75;
        let barWidth = 3;
        let frequencyBinCount = 512/2;
        let barStart = canvasMidX - ((frequencyBinCount/2) * barWidth);

        for (let i = 0; i < frequencyBinCount; i++) {
            bars.push(new Bar(barStart + i*barWidth, canvasMidY, barWidth, 20, 'orange'));
        }
    }


    function animate() {
        if (microphone.initialised) {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            const samples = microphone.getSamples();
            bars.forEach(function(bar, i) {
                bar.update(samples[i]);
                bar.draw(ctx);
            });
        }
        requestAnimationFrame(animate);
    }
    
    const microphone = new Microphone(audioPromise);
    let bars = [];
    createBars();
    animate()
    
}


module.exports = {main};