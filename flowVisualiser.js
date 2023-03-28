const Microphone = require("./microphone");
const Effect = require("./flowEffect");
const profiles = require("./flowDefaultProfiles.json");

class FlowVisualier {

    constructor(audioPromise) {
        this.canvas = document.querySelector('#myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.options = profiles.profiles[0]
        this.profileNumber = 1;
        this.maxV = 0;
        this.ctx.lineWidth = 1;

        this.setupProfiles();
        // loadOptions()
        this.setOptions(this.options);
        this.updateColours();

        this.microphone = new Microphone.Microphone(audioPromise);
        this.effect = new Effect.FlowEffect(this.canvas, this.options);
        this.effect.render(this.ctx, 5);
        this.animate();
    }

    animate() {
        if (this.microphone.initialised) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let normVolume = this.getNormalisedVolume(this.microphone)
            this.effect.updateEffect(false, normVolume, this.options)
            this.effect.render(this.ctx, normVolume);
        }
        requestAnimationFrame(this.animate.bind(this));
    }

    getNormalisedVolume(microphone) {
        if (this.options.bassMode) {
            let samples = microphone.getSamples()
            let sum = 0;
            for (let i = 0; i < samples.length / 10; i++) {
                sum += samples[i];
            }
            var volume = sum / (samples.length / 10);
        }
        else {
            var volume = microphone.getVolume();
            var volumes = microphone.getMinAndMaxVolume(volume);
        }
        let minV = 0;
        if (this.maxV < volume) {
            this.maxV = volume;
        }
        if (volume < this.maxV * 0.2) {
            this.maxV = volume;
        }
        let adjVolume = Math.floor(volume * this.options.volume) / 10;
        let adjMin = Math.floor(volumes[0] * this.options.volume) / 10;
        let adjMax = Math.floor(volumes[1] * this.options.volume) / 10;
        //let adjMaxV = this.maxV * 1.2
        //let normVolume = (adjVolume - minV) / (adjMaxV - minV);
        let normVolume = (adjVolume - adjMin) / (adjMax - adjMin) || 0.01;
        //console.log()
      //  console.log('vol:%f, max:%f, min:%f, norm: %f', adjVolume, adjMax, adjMin, normVolume);
       // console.log('vol:%f, max:%f, adj:%f, adjMax: %f, norm:%f', volume, this.maxV, adjVolume, adjMaxV, normVolume);
        return normVolume
    }

    loadOptions() {
        options.hue = Number(localStorage.getItem('hue') || options.hue);
        options.hueShift = Number(localStorage.getItem('hueShift') || options.hueShift);
        options.volume = Number(localStorage.getItem('volume') || options.volume);
        options.curve = Number(localStorage.getItem('curve') || options.curve);
        options.zoom = Number(localStorage.getItem('zoom') || options.zoom);
        options.xAdjustment = Number(localStorage.getItem('xAdjustment') || options.xAdjustment);
        options.yAdjustment = Number(localStorage.getItem('yAdjustment') || options.yAdjustment);
        options.scrollSpeed = Number(localStorage.getItem('scrollSpeed') || options.scrollSpeed);
    }
    
    setOptions(options) {
        document.querySelector('#controls-title').innerHTML = 'profile ' + this.profileNumber;
        document.querySelector('#hue').value = options.hue;
        document.querySelector('#hueShift').value = options.hueShift;
        document.querySelector('#volume').value = options.volume;
        document.querySelector('#curve').value = options.curve;
        document.querySelector('#zoom').value = options.zoom;
        document.querySelector('#xAdjustment').value = options.xAdjustment;
        document.querySelector('#yAdjustment').value = options.yAdjustment;
        document.querySelector('#scrollSpeed').value = options.scrollSpeed;
    }
    
    updateColours() {
        let micIcon = document.querySelector('#mic-icon');
        let currentSong = document.querySelector('#current-song');
        let controls = document.querySelector('#controls');
        let button = document.querySelector('#updateButton');
        let profileButton = document.querySelector('#profile-'+this.profileNumber+'-button')
        let newColour = `hsl( ${this.options.hue}, 100%, 80%)`;
    
        micIcon.style.color = newColour;
        currentSong.style.color = newColour;
        controls.style.color = newColour;
        button.style.color = newColour;
        if (profileButton) profileButton.style.backgroundColor = `hsl( ${this.options.hue}, 100%, 30%, 0.7)`;

        controls.childNodes.forEach(element => {
            if (element.nodeName === 'LABEL') {
                element.childNodes.forEach(input => {
                    if (input.nodeName === 'INPUT') input.style.color = newColour;
                })
            }
        })


    }
    
    setupProfiles() {
        let profileElements = document.querySelector('#profiles');
        for (let i = 0;  i < profiles.profiles.length; i++) {
            let button = document.createElement('button'); 
            let profileColour = `hsl( ${profiles.profiles[i].hue}, 100%, 30%, 0.7)`;
            let profileNumber = i + 1;
            button.id = 'profile-'+profileNumber+'-button';
            button.textContent = profileNumber;
            profileElements.appendChild(button);
            button.style.backgroundColor = profileColour;
            button.setAttribute('onclick', 'myBundle.changeProfile(this.textContent)')
        }
    }
    
    changeProfile(index) {
        this.options = profiles.profiles[index];
        this.profileNumber = index + 1;
        console.log('changeProfile: ' + this.options.hue);
        this.setOptions(this.options)
        this.updateColours();
    }

    changeOption(option, value) {
        this.options[option] = value;
        console.log('changeOption: ' + this.options.hue);
      //  localStorage.setItem(option, value);
        this.updateColours();
    }
}

module.exports = {FlowVisualier};