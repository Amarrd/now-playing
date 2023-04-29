const Microphone = require("./microphone");
const utils = require('./utils');
const Gradient = require('javascript-color-gradient');
const { Noise } = require('noisejs');

class Visualiser {
    constructor(audioPromise) {
        this.name = 'circle';
        this.profiles = require("./circleDefaultProfiles.json")
        this.defaultProfiles = JSON.parse(JSON.stringify(this.profiles));
        this.canvas = document.querySelector('#myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.profileNumber = 1;
        this.options = this.profiles[0];
        this.microphone = new Microphone.Microphone(audioPromise);
        this.active = true;
        const gradientArray = new Gradient()
            .setColorGradient("#3F2CAF", "#e9446a", "#edc988", "#607D8B")
            .setMidpoint(20)
            .getColors();
        console.log(gradientArray);

        this.directionModifier = 1;
        this.totalDots = 0;
        this.baseDotSize = 5;
        this.maxDotSize = 30;
        this.dotSizes = [];
        this.dotHues = [];
        this.frameCount = 0;
        this.intervalFunction;
        this.noise = new Noise();

        this.setupControls();

        // Common setup
        utils.setOptions(this);
        utils.setupProfiles(this);
        utils.updateColours(this);

        window.addEventListener('resize', e => {
            let newWidth = e.target.innerWidth;
            let newHeight = e.target.innerHeight;
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;

            this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2)

            let containers = ['#profiles', '#controls-container'];
            containers.forEach(id => {
                let container = document.querySelector(id);
                let height = (window.innerHeight - container.offsetHeight) / 2;
                container.style.top = height + 'px'
            })
        })

        this.setup();
        this.animate();
        utils.toggleProfileTransition(this, document.querySelector('#profileTransition').value);
    }

    setupControls() {
        utils.createTitle();
        utils.createNumberInput('hue', 'hue', 1, 360)
        utils.createNumberInput('hue shift', 'hueShift', 1, 360)
        utils.createNumberInput('dot multiplier', 'dotModifier', 1, 30)
        utils.createNumberInput('ring count', 'ringCount', 1, 30)
        utils.createNumberInput('ring distance', 'ringDistance', 30, 100)
        utils.createNumberInput('rotation speed', 'rotationSpeed', -20, 20)

        let controls = document.querySelector('#controls');

        let labelElement = document.createElement('label');
        labelElement.innerHTML = 'alternate rings ';
        labelElement.htmlFor = 'alternateRings';

        let inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'checkbox');
        inputElement.id = 'alternateRings';
        inputElement.setAttribute('name', 'alternateRings');
        inputElement.setAttribute('onchange', 'myBundle.changeOption(alternateRings)');

        labelElement.appendChild(inputElement);
        controls.appendChild(labelElement);
    }

    setup() {
        this.recalcTotal()
        this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2)
    }

    animate() {

        if (this.microphone.initialised) {

            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();

            this.frameCount++
            let samples = this.microphone.getSamplesFor(this.totalDots);
            let volume = utils.map(this.microphone.getVolume(), 0, 0.5, 0, 2) + 0.3;
            let currDot = 0;

            for (let ringNumber = 1; ringNumber <= this.options.ringCount; ringNumber++) {
                let dotsForRing = ringNumber * this.options.dotModifier;
                let ringRadius = ringNumber * this.options.ringDistance;

                for (let angleIncrement = 0; angleIncrement < dotsForRing; angleIncrement++) {
                    this.directionModifier = this.options.alternateRings ? (-2 * (ringNumber % 2) + 1) : 1; // for alternating ring directions
                    let angle = (this.frameCount / (Math.max(angleIncrement, 0.001) * 750)) * this.directionModifier * -this.options.rotationSpeed - 2 * Math.PI / dotsForRing;
                    let x = ringRadius * Math.sin(angle * Math.max(angleIncrement, 0.001));
                    let y = ringRadius * Math.cos(angle * Math.max(angleIncrement, 0.001));
                    let noiseInp = currDot + this.frameCount / 100
                    let noiseVal = utils.map(this.noise.perlin2(noiseInp, 0), -1, 1, 0, 1, true);
                    let adjustedNoise = noiseVal * volume;
                    //  console.log(`volume:${volume}, noiseImp: ${noiseInp}, noiseVal:${noiseVal}`)
                    let currentDotSize = this.dotSizes[currDot] || 0;
                    let currentDotHue = this.dotHues[currDot] || 0;
                    let dotSize = Math.round(utils.map(samples[currDot], 0, 1, this.baseDotSize, this.maxDotSize * ringNumber, false)) * utils.map(adjustedNoise, 0, 1, 1, 2, true);
                    let maxHue = Number(this.options.hue) + Number(this.options.hueShift);
                    let dotHue = Math.round(utils.map(samples[currDot], 0, 0.3, Number(this.options.hue), maxHue, false) * utils.map(adjustedNoise, 0, 1, 0.75, 1.25, true));

                    if (dotSize < currentDotSize) {
                        dotSize = Math.max(currentDotSize * 0.98, this.baseDotSize);
                    }

                    if (dotHue < currentDotHue) {
                        dotHue = Math.max(currentDotHue - 1, 0)
                    }

                    if (dotHue > 360) {
                        dotHue = dotHue - 360;
                    }

                    if (dotHue < 0) {
                        dotHue = dotHue + 360;
                    }

                    this.ctx.beginPath();
                    this.ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI, false);
                    this.ctx.fillStyle = `hsl(${dotHue}, 100%, 50%)`;
                    this.ctx.fill();
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = `hsl(${dotHue}, 100%, 0%)`;
                    this.ctx.stroke();

                    this.dotSizes[currDot] = dotSize;
                    this.dotHues[currDot] = dotHue;
                    currDot++;
                }
            }
        }
        if (this.active) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    recalcTotal() {
        this.totalDots = 0;
        for (let i = 1; i <= this.options.ringCount; i++) {
            this.totalDots += i * this.options.dotModifier;
        }
    }
}

module.exports = { Visualiser };