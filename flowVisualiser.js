const Microphone = require("./microphone");

var options = {
    hue: 350,
    hueShift:5,
    volume: 100,
    curve: 60,
    zoom: 7,
    xAdjustment: 1,
    yAdjustment: 0,
    scrollSpeed: 1,
    speed: 2,
    bassMode: false
}

function main(audioPromise) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.lineWidth = 1;
    loadOptions()
    setOptions()
    updateMicIcon();

    class Particle {
        constructor(effect) {
            this.effect = effect;
            this.x = Math.floor(Math.random() * this.effect.width);
            this.y = Math.floor(Math.random() * this.effect.height);
            this.speedX;
            this.speedY;
            this.speedModifier = 2;
            this.history = [{ x: this.x, y: this.y }];
            this.maxLength = Math.floor(Math.random() * 70 + 50);
            this.angle = 0;
            this.timer = this.maxLength * 2;
            this.hue = options.hue; 
            this.colours = [`hsl( ${this.hue}, 100%, 30%)`, `hsl( ${this.hue},100%,40%)`, `hsl( ${this.hue},100%, 50%)`];
            this.colour = this.colours[Math.floor(Math.random() * this.colours.length)]
        }
        draw(context) {
            context.beginPath();
            context.moveTo(this.history[0].x, this.history[0].y)
            for (let i = 0; i < this.history.length; i++) {
                context.lineTo(this.history[i].x, this.history[i].y);
            }

            context.strokeStyle = this.colour;
            context.stroke();

        }

        updateParticle(volume) {
            this.timer--;
            if (this.timer >= 1) {
                let x = Math.floor(this.x / this.effect.cellSize);
                let y = Math.floor(this.y / this.effect.cellSize);
                let index = y * this.effect.cols + x;
                this.angle = this.effect.flowField[index];

                this.speedX = Math.cos(this.angle);
                this.speedY = Math.sin(this.angle);

                let randomSpeed = Math.floor(Math.random() * options.speed + 1);
                this.x += this.speedX * (volume * randomSpeed + 0.5)
                this.y += this.speedY * (volume * randomSpeed + 0.5)

                this.history.push({ x: this.x, y: this.y });

                if (this.history.length > this.maxLength) {
                    this.history.shift();
                }

            } else if (this.history.length > 1) {
                this.history.shift();

            } else {
                this.reset(volume);
            }

        }

        reset(volume) {
            this.x = Math.floor(Math.random() * this.effect.width);
            this.y = Math.floor(Math.random() * this.effect.height);
            this.hue = volume * options.hueShift + options.hue
            //console.log(`volume:${volume}, hue:${this.hue}`)
            this.colours = [`hsl( ${this.hue}, 100%, 30%)`, `hsl( ${this.hue},100%,40%)`, `hsl( ${this.hue},100%, 50%)`];
            this.colour = this.colours[Math.floor(Math.random() * this.colours.length)]
            this.history = [{ x: this.x, y: this.y }];
            this.timer = this.maxLength;
        }

    }

    class Effect {
        constructor(canvas) {
            this.width = canvas.width;
            this.height = canvas.height;
            this.particles = [];
            this.numberOfParticles = 2000;
            this.cellSize = 20;
            this.rows;
            this.cols;
            this.flowField = [];
            this.curve = 0.3;
            this.zoom = 0.1
            this.counter = 0;
            this.updateEffect(true, 0);

            window.addEventListener('resize', e => {
                let newWidth = e.target.innerWidth;
                let newHeight = e.target.innerHeight;
                canvas.width = newWidth;
                canvas.height = newHeight;
                this.width = canvas.width;
                this.height = canvas.height;
                this.updateEffect();
            })
        }

        updateEffect(createParticles, volume) {
            this.rows = Math.floor(this.height / this.cellSize);
            this.cols = Math.floor(this.width / this.cellSize);
            this.flowField = [];
            //console.log('x:%d, y:%d', options.xAdjustment, options.yAdjustment)
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    let adjustedZoom = options.zoom/100
                    let angle = (Math.cos((x + this.counter * -options.xAdjustment) * adjustedZoom)
                        + Math.sin((y + this.counter * options.yAdjustment) * adjustedZoom)) * (volume * options.curve/100);
                    this.flowField.push(angle);
                }
            }
            this.counter += options.scrollSpeed/10;
            // console.log('scrollSpeed: %f, counter:%f', options.scrollSpeed, this.counter)

            if (createParticles) {
                for (let i = 0; i < this.numberOfParticles; i++) {
                    this.particles.push(new Particle(this));
                }
            }
        }

        render(context, volume) {
            this.particles.forEach(particle => {
                particle.draw(context);
                particle.updateParticle(volume);
            })
        }
    }

    function animate() {
        if (microphone.initialised) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let normVolume = getNormalisedVolume()
            effect.updateEffect(false, normVolume)
            effect.render(ctx, normVolume);
        }
        requestAnimationFrame(animate);
    }

    function getNormalisedVolume() {
        if (options.bassMode) {
            let samples = microphone.getSamples()
            let sum = 0;
            for (let i = 0; i< samples.length/10; i++) {
                sum += samples[i];
            }
            var volume = sum / (samples.length/10);
        }
        else {
            var volume  = microphone.getVolume();
        }
        let minV = 0;
        if (maxV < volume) {
            maxV = volume;
        }
        if (volume < maxV * 0.2) {
            maxV = volume;
        }
        let adjVolume = Math.floor(volume * options.volume) / 10;
        let adjMaxV= maxV * 1.2
        let normVolume = (adjVolume - minV) / (adjMaxV - minV);
      //  console.log('vol:%f, max:%f, adj:%f, adjMax: %f, norm:%f', volume, maxV, adjVolume, adjMaxV, normVolume);
        return normVolume
    }

    const microphone = new Microphone.Microphone(audioPromise);
    const effect = new Effect(canvas);
    effect.render(ctx, 0)
    let maxV = 0;
    animate();
}

function loadOptions() {
    options.hue = Number(localStorage.getItem('hue') || options.hue);
    options.hueShift = Number(localStorage.getItem('hueShift') || options.hueShift);
    options.volume = Number(localStorage.getItem('volume') || options.volume);
    options.curve = Number(localStorage.getItem('curve') || options.curve);
    options.zoom = Number(localStorage.getItem('zoom') || options.zoom);
    options.xAdjustment = Number(localStorage.getItem('xAdjustment') || options.xAdjustment);
    options.yAdjustment = Number(localStorage.getItem('yAdjustment') || options.yAdjustment);
    options.scrollSpeed = Number(localStorage.getItem('scrollSpeed') || options.scrollSpeed);
}

function setOptions() {
    document.querySelector('#hue').setAttribute('value', options.hue);
    document.querySelector('#hueShift').setAttribute('value', options.hueShift);
    document.querySelector('#volume').setAttribute('value', options.volume);
    document.querySelector('#curve').setAttribute('value', options.curve);
    document.querySelector('#zoom').setAttribute('value', options.zoom);
    document.querySelector('#xAdjustment').setAttribute('value', options.xAdjustment);
    document.querySelector('#yAdjustment').setAttribute('value', options.yAdjustment);
    document.querySelector('#scrollSpeed').setAttribute('value', options.scrollSpeed);
}

function updateMicIcon() {
    let micIcon = document.querySelector('#mic-icon');
    let currentSong = document.querySelector('#current-song')
    let controls = document.querySelector('#controls')
    micIcon.style.color = `hsl( ${options.hue}, 100%, 80%)`
    currentSong.style.color = `hsl( ${options.hue}, 100%, 80%)`
    controls.style.color = `hsl( ${options.hue}, 100%, 80%)`

}

function hueChange(hue) {
    options.hue = hue;
    localStorage.setItem('hue', hue);
    updateMicIcon();
}

function hueShiftChange(hueShift) {
    options.hueShift = hueShift;
    localStorage.setItem('hueShift', hueShift);
}

function volumeChange(volume) {
    options.volume = volume > 0 ? volume : 1;
    localStorage.setItem('volume', volume);
}

function curveChange(curve) {
    options.curve = curve;
    localStorage.setItem('curve', curve);
}

function zoomChange(zoom) {
    options.zoom = zoom;
    localStorage.setItem('zoom', zoom);
}

function xAdjustmentChange(xAdjustment) {
    options.xAdjustment = xAdjustment;
    localStorage.setItem('xAdjustment', xAdjustment);
}

function yAdjustmentChange(yAdjustment) {
    options.yAdjustment = yAdjustment;
    localStorage.setItem('yAdjustment', yAdjustment);
}

function scrollSpeedChange(scrollSpeed) {
    options.scrollSpeed = scrollSpeed;
    localStorage.setItem('scrollSpeed', scrollSpeed);
}

function toggleBassMode(bassMode) {
    options.bassMode = bassMode;
    localStorage.setItem('bassMode', bassMode);
}

module.exports = { main, hueChange, hueShiftChange, volumeChange, curveChange, zoomChange, xAdjustmentChange, 
    yAdjustmentChange, scrollSpeedChange, toggleBassMode }