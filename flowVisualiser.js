const Microphone = require("./microphone");
const Effect = require("./flowEffect");
const utils = require('./utils')

class Visualiser {

    constructor(audioPromise) {
        // Common properties
        this.name = 'flow';
        this.profiles = require("./flowDefaultProfiles.json")
        this.defaultProfiles = JSON.parse(JSON.stringify(this.profiles));
        this.canvas = document.querySelector('#myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.profileNumber = 1;
        this.options = this.profiles[0];
        this.microphone = new Microphone.Microphone(audioPromise);
        this.active = true;

        this.setupControls();

        // Common setup
        utils.setOptions(this);
        utils.setupProfiles(this);
        utils.updateColours(this);

        // Specific properties 
        this.maxV = 0;
        this.ctx.lineWidth = 1;
        this.transitionInterval = 0;
        this.intervalFunction;
        this.effect = new Effect.FlowEffect(this.canvas, this.options);
        this.effect.render(this.ctx, 5);
        this.animate();
        utils.toggleProfileTransition(this, document.querySelector('#profileTransition').value);
    }

    animate() {
        if (this.microphone.initialised) {
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let normVolume = this.getNormalisedVolume(this.microphone);
            this.effect.updateEffect(false, normVolume, this.options);
            this.effect.render(this.ctx, normVolume);
        }
        if (this.active) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }


    getNormalisedVolume(microphone) {
        var volume = microphone.getVolume();
        let minV = 0;
        if (this.maxV < volume) {
            this.maxV = volume;
        }
        if (volume < this.maxV * 0.2) {
            this.maxV = volume;
        }
        let adjVolume = Math.floor(volume * this.options.volume) / 10;
        let adjMaxV = this.maxV * 1.2
        let normVolume = (adjVolume - minV) / (adjMaxV - minV);
        return normVolume
    }

    setupControls() {
        utils.createTitle();
        utils.createNumberInput('hue', 'hue', 1, 360)
        utils.createNumberInput('hue shift', 'hueShift', 1, 360)
        utils.createNumberInput('volume', 'volume', 1, 200)
        utils.createNumberInput('curve', 'curve', 0, 100)
        utils.createNumberInput('zoom', 'zoom', 0, 100)
        utils.createNumberInput('particles', 'particles', 1, 3000)
        utils.createNumberInput('line width', 'lineWidth', 1, 10)
        utils.createNumberInput('horizontal scroll', 'xAdjustment', -10, 10)
        utils.createNumberInput('vertical scroll', 'yAdjustment', -10, 10)

        let directionId = 'direction';
        let directionLabel = document.createElement('label');
        directionLabel.innerHTML = directionId;
        directionLabel.htmlFor = directionId;

        let directionSelect = document.createElement('select');
        directionSelect.id = directionId;
        directionSelect.setAttribute('onchange', 'myBundle.changeOption(' + directionId + ')')

        let directions = ['up', 'down', 'left', 'right'];
        directions.forEach(direction => {
            let option = document.createElement('option');
            option.id = direction;
            option.value = direction;
            option.innerHTML = direction;
            directionSelect.appendChild(option);
        })

        let controls = document.querySelector('#controls');
        directionLabel.appendChild(directionSelect);
        controls.appendChild(directionLabel);
    }
}

module.exports = { Visualiser };