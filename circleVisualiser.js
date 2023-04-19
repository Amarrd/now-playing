const Microphone = require("./microphone");
const p5 = require('p5');

class CircleVisualiser {
    constructor(audioPromise) {
        this.microphone = new Microphone.Microphone(audioPromise);
        this.setupControls();
        this.animate();
    }

    setupControls() {
        let container = document.querySelector('#controls-container');
        let profileSwitch = document.querySelector('#profileTransitionLabel');
        profileSwitch.style.display = 'none';
        container.style.opacity = 1;
        let height = (window.innerHeight - container.offsetHeight) / 2;
        container.style.top = height + 'px';
    }

    animate() {
        const sketch = (s) => {
            let hue = 230;
            let dotModifier = 2;
            let ringCount = 14;
            let directionModifier = 1;
            let ringDistance = 50
            let hueControl = s.createInput(hue, 'number');
            let dotCountControl = s.createInput(dotModifier, 'number');
            let ringCountControl = s.createInput(ringCount, 'number');
            let symmetrical = false;

            s.setup = () => {
                let canvas = s.createCanvas(window.innerWidth, window.innerHeight);
                canvas.elt.setAttribute('onclick', 'myBundle.canvasClicked()')
                s.noFill();
                // s.stroke(s.color(`hsl(${hue}, 100%, 0%)`));
                s.strokeWeight(2);

                let hueLabel = document.createElement('label');
                hueLabel.id = 'hueLabel'
                hueLabel.innerHTML = 'hue';
                document.querySelector('#controls').appendChild(hueLabel);
                hueControl.parent('hueLabel');
                hueControl.input(changeColour);

                let dotCountLabel = document.createElement('label');
                dotCountLabel.id = 'dotCountLabel'
                dotCountLabel.innerHTML = 'dots multiplier';
                document.querySelector('#controls').appendChild(dotCountLabel);
                dotCountControl.parent('dotCountLabel');
                dotCountControl.input(changeDotCount);

                let ringCountLabel = document.createElement('label');
                ringCountLabel.id = 'ringCountLabel'
                ringCountLabel.innerHTML = 'ring count';
                document.querySelector('#controls').appendChild(ringCountLabel);
                ringCountControl.parent('ringCountLabel');
                ringCountControl.input(changeRingCount);

                s.background(0)
            }

            s.draw = () => {
                if (!this.microphone.initialised) {
                    return;
                }
                s.clear();
                let samples = this.microphone.getSampleSubArrays(ringCount, dotModifier);
                let volume = s.map(this.microphone.getVolume(), 0, 0.5, 0, 2) + 0.3;
                s.translate(window.innerWidth / 2, window.innerHeight / 2)
                let currDot = 0;
                for (let ringNumber = 1; ringNumber <= ringCount; ringNumber++) {
                    let dotsForRing = ringNumber * dotModifier;
                    let ringRadius = ringNumber * ringDistance;
                    let samplesForRing = samples[ringNumber - 1]
                    for (let angleIncrement = 0; angleIncrement < dotsForRing; angleIncrement++) {
                        let noiseForCircle = s.noise(currDot + s.frameCount / 100);
                        let adjustedNoise = noiseForCircle * volume;
                        //console.log(`volume:${volume}, noise: ${noiseForCircle}, adjustedNoise:${adjustedNoise}`);
                        directionModifier = (-2 * (ringNumber % 2) + 1) // for alternating ring directions
                        let angle = (s.frameCount / (Math.max(angleIncrement, 0.001) * 1000)) * -directionModifier - s.TWO_PI / dotsForRing;
                        let xOne = ringRadius * Math.sin(angle * Math.max(angleIncrement, 0.001));
                        let yOne = ringRadius * Math.cos(angle * Math.max(angleIncrement, 0.001));
                        let dotSize = s.map(samplesForRing[angleIncrement], 0, 1, 10, 30 * ringNumber, true) * s.map(adjustedNoise, 0, 1, 1, 2, true);
                        //s.map(s.noise(currDot + s.frameCount / 100), 0, 1, 10, 15);
                        s.circle(xOne, yOne, dotSize);
                        let maxHue = Number(hue) + 150;
                        // let colour = Math.round(s.map(s.noise(currDot + s.frameCount / 100), 0, 1, Number(hue), maxHue));
                        let colour = Math.round(s.map(samplesForRing[angleIncrement], 0, 0.4, Number(hue), maxHue, true)); //* s.map(adjustedNoise, 0, 1, 0.75, 1.25));
                        //console.log(`sample:${samplesForRing[angleIncrement]}, colour:${colour}`)
                        if (colour > 360) {
                            colour = colour - 360;
                        }
                        // let colour = angleIncrement * 10;

                        s.fill(s.color(`hsl(${colour}, 100%, 50%)`))
                        currDot++;
                    }
             //        console.log('ring:' + ringNumber + ',dotCount:' + currDot);
                }
             //     console.log(currDot);
            }

            let decay = (angleIncrement, ringNumber, adjustedNose) => {

            }

            s.windowResized = () => {
                s.resizeCanvas(window.innerWidth, window.innerHeight);
            }

            let changeColour = () => {
                hue = hueControl.value();
            }

            let changeDotCount = () => {
                dotModifier = dotCountControl.value();
            }

            let changeRingCount = () => {
                ringCount = ringCountControl.value();
            }


        }
        new p5(sketch);
    }
}

module.exports = { CircleVisualiser: CircleVisualiser };