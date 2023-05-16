const Microphone = require('./microphone');
const utils = require('./utils');
const Gradient = require('javascript-color-gradient');
const iro = require('@jaames/iro');
const colourPicker = require('./colourPicker')

class Visualiser {
    constructor(audioPromise) {
        this.name = 'Circles';
        this.profiles = require("./circleDefaultProfiles.json")
        this.defaultProfiles = JSON.parse(JSON.stringify(this.profiles));
        this.canvas = document.querySelector('#myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.profileIndex = Number(localStorage.getItem(`${this.name}-profileIndex`)) || 0;
        this.microphone = new Microphone.Microphone(audioPromise);
        this.active = true;
        this.directionModifier = 1;
        this.totalDots = 0;
        this.dotSizes = [];
        this.gradientIndexes = [];
        this.frameCount = 0;
        this.intervalFunction;
        this.sliderPicker;
        this.currentColour = 0;

        this.setupControls();
        utils.setupProfiles(this);
        utils.setOptions(this);
        this.gradientArray = new Gradient()
            .setColorGradient(...this.profiles[this.profileIndex].gradientColours)
            .setMidpoint(500)
            .getColors();
        this.updateControls();
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

        this.recalcTotal()
        this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2)

        this.animate();
        utils.toggleProfileTransition(this, document.querySelector('#profileTransition').value);
    }

    animate() {

        if (this.microphone.initialised) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();

            this.frameCount++
            let samples = this.microphone.getSamplesFor(this.totalDots);
            let volume = utils.map(this.microphone.getVolume(), 0, 0.5, 1, 2);
            let sensitivity = utils.map(this.profiles[this.profileIndex].sensitivity, 0, 10, 1, 0.1, true);
            let currDot = 0;

            for (let ringNumber = 1; ringNumber <= this.profiles[this.profileIndex].ringCount; ringNumber++) {
                let dotsForRing = ringNumber * this.profiles[this.profileIndex].dotModifier;
                let ringRadius = ringNumber * this.profiles[this.profileIndex].ringDistance;

                for (let angleIncrement = 0; angleIncrement < dotsForRing; angleIncrement++) {
                    this.directionModifier = this.profiles[this.profileIndex].alternateRings ? (-2 * (ringNumber % 2) + 1) : 1;
                    let angle = (this.frameCount / (Math.max(angleIncrement, 0.001) * 750)) * this.directionModifier * -this.profiles[this.profileIndex].rotationSpeed - 2 * Math.PI / dotsForRing;
                    let x = ringRadius * Math.sin(angle * Math.max(angleIncrement, 0.001));
                    let y = ringRadius * Math.cos(angle * Math.max(angleIncrement, 0.001));

                    let currentDotSize = this.dotSizes[currDot] || 0;
                    let currentGradientIndex = this.gradientIndexes[currDot] || 0;
                    let dotCountAdjustment = utils.map(ringNumber, 1, this.profiles[this.profileIndex].ringCount, 1, this.profiles[this.profileIndex].ringCount/4, true);
                    let dotSize = Math.round(utils.map(samples[currDot], 0, sensitivity, this.profiles[this.profileIndex].dotMin, this.profiles[this.profileIndex].dotGrowth * dotCountAdjustment, true) * volume)
                    let gradientIndex = Math.round(utils.map(samples[currDot], 0, sensitivity, 0, this.gradientArray.length - 1, true))

                    if (dotSize < currentDotSize) {
                        dotSize = Math.max(currentDotSize * 0.98, this.profiles[this.profileIndex].dotMin);
                    }

                    if (gradientIndex < currentGradientIndex) {
                        gradientIndex = Math.max(currentGradientIndex - 1, 0);
                    }

                    this.ctx.beginPath();
                    this.ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI, false);

                    this.ctx.fillStyle = this.gradientArray[gradientIndex];
                    this.ctx.fill();
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = `hsl(0, 100%, 0%)`;
                    this.ctx.stroke();

                    this.dotSizes[currDot] = dotSize;
                    this.gradientIndexes[currDot] = gradientIndex;
                    currDot++;
                }
            }
        }
        if (this.active) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    setupControls() {
        let controls = document.querySelector('#controls');
        let openColour = document.createElement('button');
        openColour.id = 'addColours'
        openColour.innerHTML = 'Configure Gradient'
        openColour.className = 'controlButtons';
        openColour.setAttribute('onclick', 'myBundle.createColourGradientPicker()');
        controls.appendChild(openColour);

        utils.createNumberInput('Ring Count', 'ringCount', 1, 30)
        utils.createNumberInput('Ring Distance', 'ringDistance', 30, 100)
        utils.createNumberInput('Dot Multiplier', 'dotModifier', 1, 30)
        utils.createNumberInput('Dot Min', 'dotMin', 5, 100)
        utils.createNumberInput('Dot Growth', 'dotGrowth', 5, 100)
        utils.createNumberInput('Sensitivity', 'sensitivity', 0, 10);
        utils.createNumberInput('Rotation Speed', 'rotationSpeed', -20, 20)

        let alternateLabel = document.createElement('label');
        alternateLabel.innerHTML = 'Alternate Rings ';
        alternateLabel.htmlFor = 'alternateRings';

        let alternateInput = document.createElement('input');
        alternateInput.setAttribute('type', 'checkbox');
        alternateInput.id = 'alternateRings';
        alternateInput.setAttribute('name', 'alternateRings');
        alternateInput.setAttribute('onchange', 'myBundle.changeOption(alternateRings)');

        alternateLabel.appendChild(alternateInput);
        controls.appendChild(alternateLabel);
    }

    updateControls() {
        this.gradientArray = new Gradient()
            .setColorGradient(...this.profiles[this.profileIndex].gradientColours)
            .setMidpoint(500)
            .getColors();
        utils.updateColours(this);
    }

    getProfileHue(index) {
        if (index >= 0) {
            let gradientArray = new Gradient()
                .setColorGradient(...this.profiles[index].gradientColours)
                .setMidpoint(500)
                .getColors();
            let iroColour = new iro.Color(gradientArray[250]);
            return iroColour.hue;
        } else {
            let gradientArray = new Gradient()
                .setColorGradient(...this.profiles[this.profileIndex].gradientColours)
                .setMidpoint(500)
                .getColors();
            let iroColour = new iro.Color(gradientArray[250])
            return iroColour.hue;
        }
    }

    recalcTotal() {
        this.totalDots = 0;
        for (let i = 1; i <= this.profiles[this.profileIndex].ringCount; i++) {
            this.totalDots += i * this.profiles[this.profileIndex].dotModifier;
        }
    }
}

module.exports = { Visualiser };