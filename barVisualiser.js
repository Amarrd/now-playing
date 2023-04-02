const Microphone = require("./microphone");

class Bar {
    constructor(x , y, width, height, colour) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height;
    this.colour = colour;
    }

    update(micInput, beat) {
        const sound = micInput * 500;
        if (sound > this.height) {
            this.height = sound;
        } else {
            this.height -= this.height * 0.03
        }
        if (beat) {
            this.colour = 'white';
        } else {
            this.colour = 'orange';
        }
        
    }
    
    draw(context) {
        // context.fillStyle = this.colour;
        // context.fillRect(this.x, this.y, this.width, -this.height);

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

    function createBars() {
        let canvasMidX = canvas.width/ 2;
        let canvasMidY = canvas.height * 0.75;
        let barWidth = 10;
        let frequencyBinCount = 512/6;
        let barStart = canvasMidX - ((frequencyBinCount/2) * barWidth);

        for (let i = 0; i < frequencyBinCount; i++) {
            bars.push(new Bar(barStart + i*barWidth, canvasMidY, barWidth, 20, 'orange'));
        }
        let volumes = document.createElement('div');
        let averageVolume = document.createElement('h3');
        let currentVolume = document.createElement('h3');
        volumes.className = 'volumes';
        volumes.className = 'volumes';
        averageVolume.id = 'averageVolume';
        currentVolume.id = 'currentVolume';
        volumes.appendChild(currentVolume);
        volumes.appendChild(averageVolume);
        document.body.appendChild(volumes);
    }


    function animate() {
        if (microphone.initialised) {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            const averageVolume = microphone.getSecondAveragedVolume(volume) || 0;
            document.querySelector('#currentVolume').innerHTML = 'current: ' + volume;
            document.querySelector('#averageVolume').innerHTML = 'average: ' + averageVolume;
            let beat = volume > averageVolume * 1.3;
            if (beat) {
                console.log('BEAT');
            }
            bars.forEach(function(bar, i) {
                bar.update(samples[i], beat);
                bar.draw(ctx);
            });
        }
        requestAnimationFrame(animate);
    }
    
    const microphone = new Microphone.Microphone(audioPromise);
    let bars = [];
    createBars();
    animate()
    
}


module.exports = {main};