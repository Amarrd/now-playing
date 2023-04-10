const Microphone = require("./microphone");
const p5 = require('p5');

class CirclesVisualiser {

    constructor(audioPromise) {
        this.microphone = new Microphone.Microphone(audioPromise);
        this.hue = 100;
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
            let hue = 0;
            let inp;
            s.setup = () => {
                s.createCanvas(window.innerWidth, window.innerHeight);
                s.noFill();
                s.stroke(hue);
                s.strokeWeight(8);

                let label = document.createElement('label');
                label.id='testLabel'
                label.htmlFor='inp';
                label.innerHTML='test';
                document.querySelector('#controls').appendChild(label);
                inp = s.createInput(hue, 'number');
                inp.position(0, 0);
                inp.size(100);
                inp.id('inp')
                inp.elt.name='inp';
                inp.parent('testLabel');
                inp.input(changeColour);
            }

            let changeColour = () => {
                hue = inp.value();
                console.log(hue)
             }

            s.draw = () => {
                s.background(0);
                s.circle(window.innerWidth / 2, window.innerHeight / 2, 100);
                s.fill(s.color(`hsl(${hue}, 100%, 50%)`))
            }


        }

        new p5(sketch);
    }
}

module.exports = { CirclesVisualiser };