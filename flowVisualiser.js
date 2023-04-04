const Microphone = require("./microphone");
const Effect = require("./flowEffect");
const profiles = require("./flowDefaultProfiles.json");

class FlowVisualier {

    constructor(audioPromise) {
        this.defaultProfiles = JSON.parse(JSON.stringify(profiles.profiles));
        this.canvas = document.querySelector('#myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.profileNumber = 1;
        this.maxV = 0;
        this.ctx.lineWidth = 1;
        this.transitionInterval = 0;
        this.intervalFunction;
        this.options = profiles.profiles[0];
        this.microphone = new Microphone.Microphone(audioPromise);
        this.effect = new Effect.FlowEffect(this.canvas, this.options);

        this.setupProfiles();
        this.setupControls();
        this.setOptions(this.options);
        this.updateColours();
        this.effect.render(this.ctx, 5);
        this.animate();
        this.toggleProfileTransition(document.querySelector('#profileTransition').value);
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
        requestAnimationFrame(this.animate.bind(this));
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

    setupProfiles() {
        for (let i = 0; i < profiles.profiles.length; i++) {
            const savedProfile = localStorage.getItem('profile_' + (i + 1));
            if (savedProfile) {
                profiles.profiles[i] = JSON.parse(savedProfile);
            }
        }

        let profileContainer = document.querySelector('#profiles');
        profileContainer.style.opacity = 1;
        for (let i = 0; i < profiles.profiles.length; i++) {
            let button = document.createElement('button');
            let profileColour = `hsl( ${Number(profiles.profiles[i].hue) + Number(profiles.profiles[i].hueShift) / 2}, 100%, 30%, 0.7)`;
            let profileNumber = i + 1;
            button.id = 'profile-' + profileNumber + '-button';
            button.textContent = profileNumber;
            button.style.backgroundColor = profileColour;
            button.setAttribute('onclick', 'myBundle.changeProfile(this.textContent)')
            profileContainer.appendChild(button);
        }

        let saveProfile = document.createElement('button');
        saveProfile.id = 'saveProfile';
        saveProfile.className = 'fa fa-save';
        saveProfile.setAttribute('onclick', 'myBundle.saveProfile()')
        saveProfile.style.backgroundColor = `hsl( ${profiles.profiles[0].hue}, 100%, 30%, 0.7)`;

        let resetProfile = document.createElement('button');
        resetProfile.id = 'resetProfile';
        resetProfile.className = 'fa fa-undo';
        resetProfile.setAttribute('onclick', 'myBundle.resetProfile()')
        resetProfile.style.backgroundColor = `hsl( ${profiles.profiles[0].hue}, 100%, 30%, 0.7)`;

        profileContainer.appendChild(document.createElement('br'));
        profileContainer.appendChild(saveProfile);
        profileContainer.appendChild(resetProfile);

        let height = (window.innerHeight - profileContainer.offsetHeight) / 2;
        profileContainer.style.top = height + 'px'

    }

    setupControls() {
        this.createNumberInput('hue', 'hue', 1, 360)
        this.createNumberInput('hue shift', 'hueShift', 1, 360)
        this.createNumberInput('volume', 'volume', 1, 200)
        this.createNumberInput('curve', 'curve', 0, 100)
        this.createNumberInput('zoom', 'zoom', 0, 100)
        this.createNumberInput('particles', 'particles', 1, 3000)
        this.createNumberInput('line width', 'lineWidth', 1, 10)
        this.createNumberInput('horizontal scroll', 'xAdjustment', -10, 10)
        this.createNumberInput('vertical scroll', 'yAdjustment', -10, 10)

        let directionId = 'direction';
        let labelElement = document.createElement('label');
        labelElement.innerHTML = directionId;
        labelElement.htmlFor = directionId;

        let inputElement = document.createElement('select');
        inputElement.id = directionId;
        inputElement.setAttribute('onchange', 'myBundle.changeOption(' + directionId + ')')

        let directions = ['up', 'down', 'left', 'right'];
        directions.forEach(direction => {
            let option = document.createElement('option');
            option.id = direction;
            option.value = direction;
            option.innerHTML = direction;
            inputElement.appendChild(option);
        })

        let controls = document.querySelector('#controls');
        labelElement.appendChild(inputElement);
        controls.appendChild(labelElement);

        let container = document.querySelector('#controls-container');
        container.style.opacity = 1;
        let height = (window.innerHeight - container.offsetHeight) / 2;
        container.style.top = height + 'px';
    }

    createNumberInput(label, id, min, max) {
        let controls = document.querySelector('#controls');

        let labelElement = document.createElement('label');
        labelElement.innerHTML = label;
        labelElement.htmlFor = id;

        let inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'number');
        inputElement.id = id;
        inputElement.setAttribute('name', id);
        inputElement.setAttribute('min', min)
        inputElement.setAttribute('max', max)
        inputElement.setAttribute('onchange', 'myBundle.changeOption(' + id + ')')

        labelElement.appendChild(inputElement);
        controls.appendChild(labelElement);
    }

    setOptions(options) {
        document.querySelector('#controls-title').innerHTML = 'profile ' + this.profileNumber;
        document.querySelector('#hue').value = options.hue;
        document.querySelector('#hueShift').value = options.hueShift;
        document.querySelector('#volume').value = options.volume;
        document.querySelector('#curve').value = options.curve;
        document.querySelector('#zoom').value = options.zoom;
        document.querySelector('#particles').value = options.particles;
        document.querySelector('#lineWidth').value = options.lineWidth;
        document.querySelector('#xAdjustment').value = options.xAdjustment;
        document.querySelector('#yAdjustment').value = options.yAdjustment;
        document.querySelector('#direction').value = options.direction;
    }

    updateColours() {
        let hue = Number(this.options.hue) + Number(this.options.hueShift) / 2;
        let controlColour = `hsl( ${hue}, 100%, 80%)`;
        let profileColour = `hsl( ${hue}, 100%, 30%, 0.7)`;

        document.querySelector('#mic-icon').style.color = controlColour;
        document.querySelector('#current-song').style.color = controlColour;
        document.querySelector('#updateButton').style.color = controlColour;
        document.querySelector('#direction').style.color = controlColour;
        document.querySelector('#saveProfile').style.backgroundColor = profileColour;
        document.querySelector('#resetProfile').style.backgroundColor = profileColour;
        document.querySelector('#profile-' + this.profileNumber + '-button').style.backgroundColor = profileColour;

        let controlsToUpdate = ['#controls', '#global-controls']

        controlsToUpdate.forEach(controls => {
            let controlElement = document.querySelector(controls);
            controlElement.style.color = controlColour;
            controlElement.childNodes.forEach(element => {
                if (element.nodeName === 'LABEL') {
                    element.childNodes.forEach(input => {
                        if (input.nodeName === 'INPUT') input.style.color = controlColour;
                    })
                }
            })
        })
    }

    changeProfile(index) {
        let previousParticleCount = this.options.particles;
        this.options = profiles.profiles[index];
        this.profileNumber = index + 1;
        console.log('changed to profile ' + this.profileNumber);
        this.setOptions(this.options)
        this.updateColours();
        let particleDiff = previousParticleCount - this.options.particles;
        this.effect.clearParticles(particleDiff);
        this.effect.updateEffect(true, 0, this.options, particleDiff)
        this.toggleProfileTransition(document.querySelector('#profileTransition').value)
    }

    saveProfile() {
        let itemName = 'profile_' + this.profileNumber;
        let profile = JSON.stringify(profiles.profiles[this.profileNumber - 1]);
        localStorage.setItem(itemName, profile);
        console.log('Saved profile ' + this.profileNumber);
        this.createSnackBar('saved');
    }

    resetProfile() {
        profiles.profiles[this.profileNumber - 1] = JSON.parse(JSON.stringify(this.defaultProfiles[this.profileNumber - 1]));
        this.changeProfile(this.profileNumber - 1);
        let itemName = 'profile_' + this.profileNumber;
        localStorage.removeItem(itemName);
        console.log('Reset profile ' + this.profileNumber);
        this.createSnackBar('reset');
    }

    createSnackBar(action) {
        let snackbar = document.querySelector('#snackbar');
        let hue = Number(this.options.hue) + Number(this.options.hueShift) / 2;
        snackbar.innerHTML = 'profile ' + this.profileNumber + ' ' + action;
        snackbar.style.color = `hsl( ${hue}, 100%, 80%)`
        snackbar.className = 'show';
        setTimeout(function () { snackbar.className = snackbar.className.replace('show', ''); }, 3000);
    }

    changeOption(option, value) {
        if (option === 'particles') {
            let particleDiff = this.options[option] - value;
            this.options[option] = value;
            this.effect.clearParticles(particleDiff);
            this.effect.updateEffect(true, 0, this.options, particleDiff)
        } else {
            this.options[option] = value;
        }
        this.updateColours();
    }

    toggleProfileTransition(value) {
        clearInterval(this.intervalFunction);
        this.transitionInterval = value * 1000;
        if (this.transitionInterval > 0) {
            console.log('triggering profile transitions every ' + this.transitionInterval + 'ms');
            this.intervalFunction = setInterval(() => this.transitionProfile(this.transitionInterval), this.transitionInterval);
        } else {
            console.log('stopping profile transitions');
        }
    }

    transitionProfile(currentInterval) {
        if (this.transitionInterval > 0 && currentInterval === this.transitionInterval) {
            let index;
            if (this.profileNumber === this.defaultProfiles.length) {
                index = 0;
            } else {
                index = this.profileNumber;
            }
            this.changeProfile(index);
        }
    }
}

module.exports = { FlowVisualier };