const Microphone = require("./microphone");


/**
 * Not currently in use
 */
class Bar {
    constructor(x , y, width, height, colour) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height;
    this.colour = colour;

    }

    update(micInput, volume) {
        //const sound = volume * 1000;
        const sound = micInput * 500;
        if (sound > this.height) {
            this.height = sound;
        } else {
            this.height -= this.height * 0.03
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
        let frequencyBinCount = 512/4;
        let barStart = canvasMidX - ((frequencyBinCount/2) * barWidth);

        for (let i = 0; i < frequencyBinCount; i++) {
            bars.push(new Bar(barStart + i*barWidth, canvasMidY, barWidth, 20, 'orange'));
        }
    }


    function animate() {
        if (microphone.initialised) {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            bars.forEach(function(bar, i) {
                bar.update(samples[i], volume);
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