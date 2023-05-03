const Microphone = require("./microphone");
const utils = require('./utils');
const Gradient = require('javascript-color-gradient');
const { Noise } = require('noisejs');
const iro = require('@jaames/iro');

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

        this.directionModifier = 1;
        this.totalDots = 0;
        this.baseDotSize = 5;
        this.maxDotSize = 30;
        this.dotSizes = [];
        this.dotHues = [];
        this.gradientIndexes = [];
        this.frameCount = 0;
        this.intervalFunction;
        this.noise = new Noise();
        this.sliderPicker;
        this.currentColour = 0;

        this.setupControls();

        // Common setup
        utils.setOptions(this);
        utils.setupProfiles(this);
        this.gradientArray = new Gradient()
        .setColorGradient(...this.options.gradientColours)
        .setMidpoint(500)
        .getColors();
        utils.updateColours(this);
        this.updateControls();

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
            let volume = utils.map(this.microphone.getVolume(), 0, 0.5, 1, 2); //+ 0.3;
            let currDot = 0;

            for (let ringNumber = 1; ringNumber <= this.options.ringCount; ringNumber++) {
                let dotsForRing = ringNumber * this.options.dotModifier;
                let ringRadius = ringNumber * this.options.ringDistance;

                for (let angleIncrement = 0; angleIncrement < dotsForRing; angleIncrement++) {
                    this.directionModifier = this.options.alternateRings ? (-2 * (ringNumber % 2) + 1) : 1;
                    let angle = (this.frameCount / (Math.max(angleIncrement, 0.001) * 750)) * this.directionModifier * -this.options.rotationSpeed - 2 * Math.PI / dotsForRing;
                    let x = ringRadius * Math.sin(angle * Math.max(angleIncrement, 0.001));
                    let y = ringRadius * Math.cos(angle * Math.max(angleIncrement, 0.001));
                    let noiseInp = currDot + this.frameCount / 100
                    let noiseVal = utils.map(this.noise.perlin2(noiseInp, 0), -1, 1, 0, 1, true);
                    let adjustedNoise = noiseVal * volume;
                    let currentDotSize = this.dotSizes[currDot] || 0;
                    let currentDotHue = this.dotHues[currDot] || 0;
                    let currentGradientIndex = this.gradientIndexes[currDot] || 0;
                    let dotSize = Math.round(utils.map(samples[currDot], 0, 1, this.baseDotSize, this.maxDotSize * ringNumber, false)) * volume //* utils.map(adjustedNoise, 0, 1, 1, 2, true);
                    let maxHue = Number(this.options.hue) + Number(this.options.hueShift);
                    let dotHue = Math.round(utils.map(samples[currDot], 0, 0.5, Number(this.options.hue), maxHue, false)) //* utils.map(adjustedNoise, 0, 1, 0.75, 1.25, true));
                    let gradientIndex = Math.round(utils.map(samples[currDot], 0, 0.5, 0, this.gradientArray.length - 1, true))

                    if (dotSize < currentDotSize) {
                        dotSize = Math.max(currentDotSize * 0.98, this.baseDotSize);
                    }

                    if (dotHue < currentDotHue) {
                        dotHue = Math.max(currentDotHue - 1, 0);
                    }

                    if (gradientIndex < currentGradientIndex) {
                        gradientIndex = Math.max(currentGradientIndex - 1, 0);
                    }

                    if (dotHue > 360) {
                        dotHue = dotHue - 360;
                    }

                    if (dotHue < 0) {
                        dotHue = dotHue + 360;
                    }

                    this.ctx.beginPath();
                    this.ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI, false);
                    if (this.options.colourMode === 'gradient') {
                        this.ctx.fillStyle = this.gradientArray[gradientIndex];
                    } else {
                        this.ctx.fillStyle = `hsl(${dotHue}, 100%, 50%)`;
                    }
                    this.ctx.fill();
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = `hsl(0, 100%, 0%)`;
                    this.ctx.stroke();

                    this.dotSizes[currDot] = dotSize;
                    this.dotHues[currDot] = dotHue;
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
        let colourModes = {
            hue_Shift: 'hue shift',
            gradient: 'gradient'
        }

        utils.createSelectInput('colour mode', 'colourMode', colourModes)

        let openColour = document.createElement('button');
        openColour.id = 'addColours'
        openColour.innerHTML = 'add colours'
        openColour.setAttribute('onclick', 'myBundle.addColours()');
        controls.appendChild(openColour);

        utils.createNumberInput('hue', 'hue', 1, 360)
        utils.createNumberInput('hue shift', 'hueShift', 1, 360)
        utils.createNumberInput('dot multiplier', 'dotModifier', 1, 30)
        utils.createNumberInput('ring count', 'ringCount', 1, 30)
        utils.createNumberInput('ring distance', 'ringDistance', 30, 100)
        utils.createNumberInput('rotation speed', 'rotationSpeed', -20, 20)

        let alternateLabel = document.createElement('label');
        alternateLabel.innerHTML = 'alternate rings ';
        alternateLabel.htmlFor = 'alternateRings';

        let alternateInput = document.createElement('input');
        alternateInput.setAttribute('type', 'checkbox');
        alternateInput.id = 'alternateRings';
        alternateInput.setAttribute('name', 'alternateRings');
        alternateInput.setAttribute('onchange', 'myBundle.changeOption(alternateRings)');

        alternateLabel.appendChild(alternateInput);
        controls.appendChild(alternateLabel);
    }

    createColourDialogue() {
        let blockingDiv = document.createElement('div');
        let prompt = document.createElement('div');
        let buttons = document.createElement('div');
        let close = document.createElement('button');
        let clear = document.createElement('button');
        const colour = document.querySelector('#controls').style.color;

        blockingDiv.id = 'blockingDiv';
        blockingDiv.className = 'blockingDiv';
        document.body.appendChild(blockingDiv);

        prompt.className = 'credentialsPrompt';
        prompt.id = 'colourPrompt';
        prompt.innerHTML = 'gradient colours';
        prompt.style.color = colour;
        prompt.style.opacity = 1;
        prompt.style.margin = '20px'

        clear.innerHTML = 'clear';
        clear.id = 'clearColour';
        clear.style.color = colour;
        clear.style.float = 'left';
        clear.style.marginLeft = '20px'
        clear.setAttribute('onclick', 'myBundle.clearColour()');


        close.innerHTML = 'close';
        close.id = 'closeColour';
        close.style.color = colour;
        close.style.float = 'right'
        close.style.marginRight = '20px'
        close.setAttribute('onclick', 'myBundle.closeColours()');

        document.body.appendChild(prompt);

        this.sliderPicker = new iro.ColorPicker("#colourPrompt", {
            width: 350,
            color: this.options.gradientColours[0],
            borderWidth: 1,
            borderColor: "grey",
            layout: [
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: 'hue'
                    }
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: 'saturation'
                    }
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: 'value'
                    }
                },
            ]
        });

        this.sliderPicker.on('color:change', function(colour) {
            let colourButton = Array.from(document.querySelector('#gradientButtons').childNodes).find(button => button.getAttribute('currentColour') === 'true')
            if (!colourButton) {
                return;
            }
            colourButton.style.backgroundColor = colour.hexString;
        })

        let gradientButtons = document.createElement('div');
        gradientButtons.className = 'gradientButtons';
        gradientButtons.id = 'gradientButtons';
        for (let i = 0; i < 6; i++) {
            let button = document.createElement('button');
            let colourNumber = i + 1;
            button.id = 'colour-' + colourNumber + '-button';
            button.setAttribute('index', i);
            button.textContent = " ";
            button.style.backgroundColor = this.options.gradientColours[i] || 'rgba(0, 0, 0, 0)';
            button.style.margin = '5px';
            button.style.height = '50px';
            button.style.width = '50px';
            button.style.border = '2px solid #e7e7e7'
            button.setAttribute('onclick', 'myBundle.colourClicked(this)');
            button.setAttribute('currentColour', i === 0 ? 'true' : 'false');
            button.style.border = i === 0 ? '3px solid #e7e7e7' : '2px solid #e7e7e7';
            gradientButtons.appendChild(button);
        }

        prompt.appendChild(gradientButtons);
        buttons.appendChild(clear);
        buttons.appendChild(close);
        prompt.appendChild(buttons);

        let height = (window.innerHeight - prompt.offsetHeight) / 2;
        let width = (window.innerWidth - prompt.offsetWidth) / 2;
        prompt.style.top = height + 'px';
        prompt.style.left = width + 'px';
    }

    closeColourDialogue() {

        this.options.gradientColours = Array.from(document.querySelector('#gradientButtons').childNodes)
        .map(button => new iro.Color(button.style.backgroundColor).hexString)
        .filter(colour => colour != "#000000");

        this.gradientArray = new Gradient()
        .setColorGradient(...this.options.gradientColours)
        .setMidpoint(100)
        .getColors(); 

        this.options.hue = new iro.Color(this.gradientArray[50]).hue;

        utils.updateColours(this);
        document.body.removeChild(document.querySelector('#colourPrompt'))
        document.body.removeChild(document.querySelector('#blockingDiv'))
    }

    colourClicked(colour) {
        document.querySelector('#gradientButtons').childNodes.forEach(button => {
            button.setAttribute('currentColour', 'false');
            button.style.border = '2px solid #e7e7e7'
        })
        if (colour.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            this.sliderPicker.color.rgbString = colour.style.backgroundColor;
        }
        this.currentColour = colour.getAttribute('index');
        colour.setAttribute('currentColour', 'true');
        colour.style.border = '3px solid #e7e7e7'
    }

    clearColour() {
        document.querySelector('#gradientButtons').childNodes.forEach(colour => {
            if (colour.getAttribute('currentColour') === 'true') {
                colour.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            }
        })
    }

    colourPickerChanged() {
        let colourButton = document.querySelector(`colour-${this.currentColour}-button`);
        if (!colourButton) {
            return;
        }
        colourButton.style.backgroundColor = this.sliderPicker.color.hexString;
    }

    updateControls() {
        if (this.options.colourMode == 'gradient') {
            document.querySelector('#hueLabel').style.display = 'none'
            document.querySelector('#hueShiftLabel').style.display = 'none'
            document.querySelector('#addColours').style.display = 'inline'
            this.options.hue = Math.round(new iro.Color(this.gradientArray[50]).hue);
            this.options.hueShift = 0;
        } else {
            document.querySelector('#hueLabel').style.display = 'inline'
            document.querySelector('#hueShiftLabel').style.display = 'inline'
            document.querySelector('#addColours').style.display = 'none'
        }
        utils.updateColours(this);
    }

    recalcTotal() {
        this.totalDots = 0;
        for (let i = 1; i <= this.options.ringCount; i++) {
            this.totalDots += i * this.options.dotModifier;
        }
    }
}

module.exports = { Visualiser };