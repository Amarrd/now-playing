const perlin = require('perlin-noise-3d');
const Microphone = require("./microphone");

function main(audioPromise) {
    const canvas =  document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = '#eb8100' //'#fc9003';
    ctx.strokeStyle = '#eb8100';
    ctx.lineWidth = 1.5;

    class Particle {
        constructor(effect) {
            this.effect = effect;
            this.x = Math.floor(Math.random() * this.effect.width);
            this.y = Math.floor(Math.random() * this.effect.height);
            this.speedX;
            this.speedY; 
            this.speedModifier = Math.floor(Math.random() * 2 + 1);
            this.history = [{x: this.x, y: this.y}];
            this.maxLength = Math.floor(Math.random() * 100 + 10);
            this.angle = 0;
            this.timer = this.maxLength * 1;
            this.colours = ['#fc9003', '#e89531', '#edd2b2'] // fill this array with some dynamically generated colours using the frequency?
            this.colour = this.colours[Math.floor(Math.random() * this.colours.length)]
        }
        draw(context, volume) {
            // this.colours = ['#fc9003', '#e89531', '#edd2b2']
            // this.colour = this.colours[Math.floor(Math.random() * this.colours.length)]
            context.beginPath();
            context.moveTo(this.history[0].x, this.history[0].y)
            for (let i = 0; i < this.history.length; i++) {
                context.lineTo(this.history[i].x, this.history[i].y);
            }
            
            context.strokeStyle = this.colour;
            context.stroke();

        }
        update(volume) {
            this.timer--;
            if (this.timer >= 1) {
                let x = Math.floor(this.x / this.effect.cellSize);
                let y = Math.floor(this.y / this.effect.cellSize);
                let index = y * this.effect.cols + x;
                this.angle = this.effect.flowField[index];
    
                this.speedX = Math.cos(this.angle);
                this.speedY = Math.sin(this.angle);
              
                this.x += this.speedX * (volume +1)  //* this.speedModifier //+ (volume);
                this.y += this.speedY * (volume +1)//*this.speedModifier //+ (volume);
         
                this.history.push({x: this.x, y: this.y});
                if (this.history.length > this.maxLength) {
                    this.history.shift();
                }
            } else if(this.history.length > 1) {
                this.history.shift();
            } else {
                this.reset();
            }

        }
        reset() {
            this.x = Math.floor(Math.random() * this.effect.width);
            this.y = Math.floor(Math.random() * this.effect.height);
            this.history = [{x: this.x, y: this.y}];
            this.timer = this.maxLength;
        }

    }

    class Effect {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.particles = [];
            this.numberOfParticles = 1500;
            this.cellSize = 20;
            this.rows;
            this.cols;
            this.flowField = [];
            this.curve = 0.5;
            this.zoom = 0.15
            this.noise;
            this.counter = 0;
            this.update(true, 0);
        }
        update(createParticles, volume) {
            // create flow field
            if (createParticles) {
                this.rows = Math.floor(this.height / this.cellSize);
                this.cols = Math.floor(this.width / this.cellSize);
                this.noise = new perlin();
            }

            this.flowField = [];
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    //ctx.lineWidth = adjustedVolume 
                    //console.log((volume * 3.4 + 0.1));
                    let angle = (Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * (volume * 0.2 + 0.1 );
                    //let angle = this.noise.get(x, y, 0)* 2 * Math.PI;
                    this.flowField.push(angle);
                }
            }
            this.counter++

            // create particles
            if (createParticles) {
                for (let i = 0; i < this.numberOfParticles; i++) {
                    this.particles.push(new Particle(this));
                }
            }
        }
        render(context, volume) {
            this.particles.forEach(particle => {
                particle.draw(context, volume);
                particle.update(volume);
            })
        }

    }

    let maxV = 0;

    function animate() {
        if (microphone.initialised) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let volume = microphone.getVolume();
        let minV = 0;
        if (maxV < volume) {
            maxV = volume;
        }
        if (volume < maxV/2) {
            maxV = volume;
        }
        let adjVolume = Math.floor(microphone.getVolume() * 75)/10;
        let normVolume = (adjVolume - minV)/(maxV - minV);
        effect.update(false, normVolume)
        effect.render(ctx, normVolume);
        }
        requestAnimationFrame(animate);
    }

    const microphone = new Microphone.Microphone(audioPromise);
    const effect = new Effect(canvas.width, canvas.height);
    effect.render(ctx, 0)  
    animate();
}

module.exports = {main}