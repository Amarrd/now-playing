const Microphone = require("./microphone");
const Effect = require("./flowEffect");
const profiles = require("./flowDefaultProfiles.json");
//const Snackbar = require('node-snackbar');

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

        this.loadProfiles();
        this.setupProfiles();
        this.options = profiles.profiles[0];
        this.setOptions(this.options);
        this.updateColours();

        this.microphone = new Microphone.Microphone(audioPromise);
        this.effect = new Effect.FlowEffect(this.canvas, this.options);
        this.effect.render(this.ctx, 5);
        this.animate();
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
        if (this.options.bassMode) {
            let samples = microphone.getSamples();
            let sum = 0;
            for (let i = 0; i < samples.length / 10; i++) {
                sum += samples[i];
            }
            var volume = sum / (samples.length / 10);
        }
        else {
            var volume = microphone.getVolume();
        }
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
        //  console.log('vol:%f, max:%f, adj:%f, adjMax: %f, norm:%f', volume, maxV, adjVolume, adjMaxV, normVolume);
        return normVolume
    }

    loadProfiles() {
        for (let i = 0; i < profiles.profiles.length; i++) {
            const savedProfile = localStorage.getItem('profile_' + (i + 1));
            if (savedProfile) {
                profiles.profiles[i] = JSON.parse(savedProfile);
            }
        }
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
        document.querySelector('#controls').style.opacity = 1;
    }

    updateColours() {
        let controlColour = `hsl( ${this.options.hue}, 100%, 80%)`;
        let profileColour = `hsl( ${this.options.hue}, 100%, 30%, 0.7)`;

        document.querySelector('#mic-icon').style.color = controlColour;
        document.querySelector('#current-song').style.color = controlColour;
        document.querySelector('#updateButton').style.color = controlColour;
        document.querySelector('#direction').style.color = controlColour;
        document.querySelector('#saveProfile').style.backgroundColor = profileColour;
        document.querySelector('#resetProfile').style.backgroundColor = profileColour;
        document.querySelector('#profile-' + this.profileNumber + '-button').style.backgroundColor = profileColour;

        let controls = document.querySelector('#controls');
        controls.style.color = controlColour;
        controls.childNodes.forEach(element => {
            if (element.nodeName === 'LABEL') {
                element.childNodes.forEach(input => {
                    if (input.nodeName === 'INPUT') input.style.color = controlColour;
                })
            }
        })


    }

    setupProfiles() {
        let profileElements = document.querySelector('#profiles');
        profileElements.style.opacity = 1;
        for (let i = 0; i < profiles.profiles.length; i++) {
            let button = document.createElement('button');
            let profileColour = `hsl( ${profiles.profiles[i].hue}, 100%, 30%, 0.7)`;
            let profileNumber = i + 1;
            button.id = 'profile-' + profileNumber + '-button';
            button.textContent = profileNumber;
            button.style.backgroundColor = profileColour;
            button.setAttribute('onclick', 'myBundle.changeProfile(this.textContent)')
            profileElements.appendChild(button);
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

        profileElements.appendChild(document.createElement('br'));
        profileElements.appendChild(saveProfile);
        profileElements.appendChild(resetProfile);

    }

    changeProfile(index) {
        let previousParticleCount = this.options.particles;
        this.options = profiles.profiles[index];
        this.profileNumber = index + 1;
        console.log('changeProfile: ' + this.profileNumber);
        this.setOptions(this.options)
        this.updateColours();
        let particleDiff = previousParticleCount - this.options.particles;
        this.effect.clearParticles(particleDiff);
        this.effect.updateEffect(true, 0, this.options, particleDiff)
    }

    saveProfile() {
        let itemName = 'profile_' + this.profileNumber;
        let profile = JSON.stringify(profiles.profiles[this.profileNumber - 1]);
        localStorage.setItem(itemName, profile);
        console.log('Saved profile ' + this.profileNumber)
        console.log(localStorage.getItem(itemName));
        var snackbar = document.getElementById("snackbar");
        snackbar.innerHTML = 'Saved Profile'
        snackbar.style.color = `hsl( ${this.options.hue}, 100%, 80%)`
        snackbar.className = "show";
        setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
    }

    resetProfile() {
        console.log('options:')
        console.log(this.options)
        console.log('profile:')
        console.log(profiles.profiles[this.profileNumber - 1]);
        console.log('default:')
        console.log(this.defaultProfiles[this.profileNumber - 1]);

        profiles.profiles[this.profileNumber - 1] = JSON.parse(JSON.stringify(this.defaultProfiles[this.profileNumber - 1]));
        this.changeProfile(this.profileNumber - 1);
        let itemName = 'profile_' + this.profileNumber;
        localStorage.removeItem(itemName);
        console.log('Reset profile ' + this.profileNumber)
        var snackbar = document.getElementById("snackbar");
        snackbar.innerHTML = 'Reset Profile'
        snackbar.style.color = `hsl( ${this.options.hue}, 100%, 80%)`
        snackbar.className = "show";
        setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
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
}

module.exports = { FlowVisualier };