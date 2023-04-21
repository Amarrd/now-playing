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
        let height = (window.innerHeight - container.offsetHeight) / 2;

        container.style.opacity = 1;
        container.style.top = height + 'px';
        profileSwitch.style.display = 'none';
    }

    animate() {
        const sketch = (s) => {
            let baseHue = 10;
            let hueShift = 30;
            let dotModifier = 3;
            let ringCount = 12;
            let directionModifier = 1;
            let ringDistance = 50
            let totalDots = 0;
            let baseDotSize = 5;
            let maxDotSize = 30;
            let hueControl = s.createInput(baseHue, 'number');
            let dotCountControl = s.createInput(dotModifier, 'number');
            let ringCountControl = s.createInput(ringCount, 'number');
            let dotSizes = [];

            s.setup = () => {
                let canvas = s.createCanvas(window.innerWidth, window.innerHeight);
                canvas.elt.setAttribute('onclick', 'myBundle.canvasClicked()')
                s.noFill();
                s.strokeWeight(1);

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
                recalcTotal();
            }

            s.draw = () => {
                if (!this.microphone.initialised) {
                    return;
                }

                let samples = this.microphone.getSamplesFor(totalDots);
                let volume = s.map(this.microphone.getVolume(), 0, 0.5, 0, 2) + 0.3;
                let currDot = 0;
                s.clear();
                s.translate(window.innerWidth / 2, window.innerHeight / 2)

                for (let ringNumber = 1; ringNumber <= ringCount; ringNumber++) {
                    let dotsForRing = ringNumber * dotModifier;
                    let ringRadius = ringNumber * ringDistance;

                    for (let angleIncrement = 0; angleIncrement < dotsForRing; angleIncrement++) {
                        //directionModifier = (-2 * (ringNumber % 2) + 1) // for alternating ring directions
                        let angle = (s.frameCount / (Math.max(angleIncrement, 0.001) * 1000)) * -directionModifier - s.TWO_PI / dotsForRing;
                        let x = ringRadius * Math.sin(angle * Math.max(angleIncrement, 0.001));
                        let y = ringRadius * Math.cos(angle * Math.max(angleIncrement, 0.001));
                        let adjustedNoise = s.noise(currDot + s.frameCount / 100) * volume;
                        let currentDotSize = dotSizes[currDot] || 0;
                        let dotSize = s.map(samples[currDot], 0, 1, baseDotSize, maxDotSize * ringNumber, true) * s.map(adjustedNoise, 0, 1, 1, 2, true);
                        let maxHue = Number(baseHue) + Number(hueShift);
                        let hue = Math.round(s.map(samples[currDot], 0, 0.3, Number(baseHue), maxHue, true)); //* s.map(adjustedNoise, 0, 1, 0.75, 1.25));

                        if (dotSize < currentDotSize) {
                            dotSize = Math.max(currentDotSize * 0.98, baseDotSize);
                        }
                        
                        if (hue > 360) {
                            hue = hue - 360;
                        }

                        if (hue < 0) {
                            hue = hue + 360;
                        }
                        
                        s.circle(x, y, dotSize);
                        s.fill(s.color(`hsl(${hue}, 100%, 50%)`))

                        dotSizes[currDot] = dotSize;
                        currDot++;
                    }
                }
            }

            s.windowResized = () => {
                s.resizeCanvas(window.innerWidth, window.innerHeight);
            }

            let changeColour = () => {
                baseHue = hueControl.value();
            }

            let changeDotCount = () => {
                dotModifier = dotCountControl.value();
                recalcTotal();
            }

            let changeRingCount = () => {
                ringCount = ringCountControl.value();
                recalcTotal();
            }

            let recalcTotal = () => {
                totalDots = 0;
                for (let i = 1; i <= ringCount; i++) {
                    totalDots += i * dotModifier;
                }
            }


        }
        new p5(sketch);
    }
}

module.exports = { CircleVisualiser: CircleVisualiser };