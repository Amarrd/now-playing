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
            let hue = 250;
            let ringCount = 6;
            let directionModifier = 1;
            let dotModifier = 10;
            let ringDistance = 100
            let inp = s.createInput(hue, 'number');
            let symmetrical = false;

            s.setup = () => {
                let canvas = s.createCanvas(window.innerWidth, window.innerHeight);
                canvas.elt.setAttribute('onclick', 'myBundle.canvasClicked()')
                s.noFill();
               // s.stroke(s.color(`hsl(${hue}, 100%, 0%)`));
                s.strokeWeight(2);

                let label = document.createElement('label');
                label.id = 'hueLabel'
                label.innerHTML = 'hue';
                document.querySelector('#controls').appendChild(label);
                inp.parent('hueLabel');
                inp.input(changeColour);
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
                    if (symmetrical) {
                    } else {
                        for (let angleIncrement = 0; angleIncrement < dotsForRing; angleIncrement++) {
                            let noiseForCircle = s.noise(currDot + s.frameCount / 100);
                            let adjustedNoise = noiseForCircle * volume;
                            //console.log(`volume:${volume}, noise: ${noiseForCircle}, adjustedNoise:${adjustedNoise}`);
                            directionModifier = (-2*(ringNumber%2)+1) // for alternating ring directions
                            let angleOne = (s.frameCount / (Math.max(angleIncrement, 0.001) * 1000)) * -directionModifier - s.TWO_PI / dotsForRing;
                            let xOne = ringRadius * Math.sin(angleOne * Math.max(angleIncrement, 0.001));
                            let yOne = ringRadius * Math.cos(angleOne * Math.max(angleIncrement, 0.001));

                            let dotSize = s.map(samplesForRing[angleIncrement], 0, 1, 30, 80 * ringNumber,true) * s.map(adjustedNoise, 0, 1, 1, 5);

                            //s.map(s.noise(currDot + s.frameCount / 100), 0, 1, 10, 15);
                            s.circle(xOne, yOne, dotSize);
                            let maxHue = Number(hue) + 130;
                            // let colour = Math.round(s.map(s.noise(currDot + s.frameCount / 100), 0, 1, Number(hue), maxHue));
                            let colour = Math.round(s.map(samplesForRing[angleIncrement], 0, 0.5, Number(hue), maxHue, true) * s.map(adjustedNoise,0,1,0.75,1.25));
                            //console.log(`sample:${samplesForRing[angleIncrement]}, colour:${colour}`)
                            if (colour > 360) {
                                colour = colour - 360;
                            }
                            // let colour = angleIncrement * 10;

                            s.fill(s.color(`hsl(${colour}, 100%, 50%)`))
                            currDot++;
                        }
                    }
                   // console.log('ring:' + ringNumber + ',dotCount:' + currDot);
                }
              //  console.log(currDot);
            }

             let decay = (angleIncrement, ringNumber, adjustedNose) => {

             }

            s.windowResized = () => {
                s.resizeCanvas(window.innerWidth, window.innerHeight);
            }

            let changeColour = () => {
                hue = inp.value();
            }


        }
        new p5(sketch);
    }
}


// for (let angleIncrement = 0; angleIncrement <= dotsForRing/2; angleIncrement++) {
//     directionModifier = (-2*(ringNumber%2)+1) // for alternating ring directions
//     let angleOne = (s.frameCount / (Math.max(angleIncrement, 0.001) * 1000)) * -directionModifier - s.TWO_PI / dotsForRing;
//     let xOne = ringRadius * Math.sin(angleOne * Math.max(angleIncrement, 0.001));
//     let yOne = ringRadius * Math.cos(angleOne * Math.max(angleIncrement, 0.001));
//     let angleTwo = (s.frameCount / (Math.max(angleIncrement, 0.001) * 1000)) * -directionModifier + s.TWO_PI / dotsForRing;
//     let xTwo = ringRadius * Math.sin(angleTwo * Math.max(angleIncrement, 0.001));
//     let yTwo = ringRadius * Math.cos(angleTwo * Math.max(angleIncrement, 0.001));
//     let dotSize = s.map(s.noise(currDot + s.frameCount / 100), 0, 1, 0, 100);
//     s.circle(xOne, yOne, dotSize);
//     s.circle(xTwo, yTwo, dotSize);
//     let maxHue = Number(hue) + 130;
//     let colour = Math.round(s.map(s.noise(currDot + s.frameCount / 100), 0, 1, Number(hue), maxHue));
//     if (colour > 360) {
//         colour = colour - 360;
//     }
//     if (ringNumber === 1){
//         s.fill(s.color(`hsl(${colour}, 100%, 100%)`))
//     } else {
//         s.fill(s.color(`hsl(${colour}, 100%, 50%)`))
//     }
//     currDot++;
// } 

module.exports = { CircleVisualiser: CircleVisualiser };