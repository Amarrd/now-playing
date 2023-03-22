const Microphone = require("./microphone");
const Effect = require("./flowEffect");
const profiles = require("./flowDefaultProfiles.json");

//var options = profiles.profiles[0];

class FlowVisualier {

    constructor(audioPromise) {
        this.canvas = document.querySelector('#myCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.options = profiles.profiles[0]
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
            this.effect.updateEffect(false, normVolume)
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
        document.querySelector('#hue').setAttribute('value', options.hue);
        document.querySelector('#hueShift').setAttribute('value', options.hueShift);
        document.querySelector('#volume').setAttribute('value', options.volume);
        document.querySelector('#curve').setAttribute('value', options.curve);
        document.querySelector('#zoom').setAttribute('value', options.zoom);
        document.querySelector('#xAdjustment').setAttribute('value', options.xAdjustment);
        document.querySelector('#yAdjustment').setAttribute('value', options.yAdjustment);
        document.querySelector('#scrollSpeed').setAttribute('value', options.scrollSpeed);
    }
    
    updateColours() {
        let micIcon = document.querySelector('#mic-icon');
        let currentSong = document.querySelector('#current-song');
        let controls = document.querySelector('#controls');
        let button = document.querySelector('#updateButton');
        let newColour = `hsl( ${this.options.hue}, 100%, 80%)`;
    
        micIcon.style.color = newColour;
        currentSong.style.color = newColour;
        controls.style.color = newColour;
        button.style.color = newColour;
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
            console.log(button);
            button.textContent = 'Profile ' + (i+1);
            profileElements.appendChild(button);
            button.setAttribute('onclick', 'myBundle.changeProfile(this.textContent)')
        }
    }
    
    changeProfile(index) {
        options = profiles.profiles[index];
        setOptions()
    }
    
    hueChange(hue) {
        options.hue = hue;
        localStorage.setItem('hue', hue);
        updateColours();
    }
    
    hueShiftChange(hueShift) {
        options.hueShift = hueShift;
        localStorage.setItem('hueShift', hueShift);
    }
    
    volumeChange(volume) {
        options.volume = volume > 0 ? volume : 1;
        localStorage.setItem('volume', volume);
    }
    
    curveChange(curve) {
        options.curve = curve;
        localStorage.setItem('curve', curve);
    }
    
    zoomChange(zoom) {
        options.zoom = zoom;
        localStorage.setItem('zoom', zoom);
    }
    
    xAdjustmentChange(xAdjustment) {
        options.xAdjustment = xAdjustment;
        localStorage.setItem('xAdjustment', xAdjustment);
    }
    
    yAdjustmentChange(yAdjustment) {
        options.yAdjustment = yAdjustment;
        localStorage.setItem('yAdjustment', yAdjustment);
    }
    
    scrollSpeedChange(scrollSpeed) {
        options.scrollSpeed = scrollSpeed;
        localStorage.setItem('scrollSpeed', scrollSpeed);
    }
    
    toggleBassMode(bassMode) {
        options.bassMode = bassMode;
        localStorage.setItem('bassMode', bassMode);
    }
}



module.exports = {FlowVisualier};