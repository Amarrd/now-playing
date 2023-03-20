const Microphone = require("./microphone");
const Effect = require("./flowEffect");

var options = {
    hue: 10,
    hueShift: 2,
    volume: 100,
    curve: 10,
    zoom: 7,
    xAdjustment: -1,
    yAdjustment: -1,
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
    updateColours();

    function animate() {
        if (microphone.initialised) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let normVolume = getNormalisedVolume(microphone)
            effect.updateEffect(false, normVolume)
            effect.render(ctx, normVolume);
        }
        requestAnimationFrame(animate);
    }

    function getNormalisedVolume(microphone) {
        if (options.bassMode) {
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
        if (maxV < volume) {
            maxV = volume;
        }
        if (volume < maxV * 0.2) {
            maxV = volume;
        }
        let adjVolume = Math.floor(volume * options.volume) / 10;
        let adjMaxV = maxV * 1.2
        let normVolume = (adjVolume - minV) / (adjMaxV - minV);
        //  console.log('vol:%f, max:%f, adj:%f, adjMax: %f, norm:%f', volume, maxV, adjVolume, adjMaxV, normVolume);
        return normVolume
    }

    const microphone = new Microphone.Microphone(audioPromise);
    const effect = new Effect.FlowEffect(canvas, options);
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

function updateColours() {
    let micIcon = document.querySelector('#mic-icon');
    let currentSong = document.querySelector('#current-song');
    let controls = document.querySelector('#controls');
    let button = document.querySelector('#updateButton');
    let newColour = `hsl( ${options.hue}, 100%, 80%)`;

    micIcon.style.color = newColour;
    currentSong.style.color = newColour;
    controls.style.color = newColour;
    button.style.color = newColour;
    controls.childNodes.forEach(element => {
        if (element.nodeName === 'LABEL') {
            console.log(element);
            element.childNodes.forEach(input => {
                if (input.nodeName === 'INPUT') input.style.color = newColour;
            })
        }
    })
}

function hueChange(hue) {
    options.hue = hue;
    localStorage.setItem('hue', hue);
    updateColours();
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

module.exports = {
    main, hueChange, hueShiftChange, volumeChange, curveChange, zoomChange, xAdjustmentChange,
    yAdjustmentChange, scrollSpeedChange, toggleBassMode
}