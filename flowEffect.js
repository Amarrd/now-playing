const Particle = require('./flowParticle')

class FlowEffect {

    constructor(canvas, options) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.options = options;
        this.particles = [];
        this.numberOfParticles = 2000;
        this.cellSize = 20;
        this.rows;
        this.cols;
        this.flowField = [];
        this.curve = 0.3;
        this.zoom = 0.1
        this.counter = 0;
        this.updateEffect(true, 0);

        window.addEventListener('resize', e => {
            let newWidth = e.target.innerWidth;
            let newHeight = e.target.innerHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            this.width = canvas.width;
            this.height = canvas.height;
            this.updateEffect();
        })
    }

    updateEffect(createParticles, volume) {
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];
        //console.log('x:%d, y:%d', options.xAdjustment, options.yAdjustment)
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                let adjustedZoom = this.options.zoom / 100
                let angle = (Math.cos((x + this.counter * -this.options.xAdjustment) * adjustedZoom)
                    + Math.sin((y + this.counter * this.options.yAdjustment) * adjustedZoom)) * (volume * this.options.curve / 100);
                this.flowField.push(angle);
            }
        }
        this.counter += this.options.scrollSpeed / 10;
        // console.log('scrollSpeed: %f, counter:%f', options.scrollSpeed, this.counter)

        if (createParticles) {
            for (let i = 0; i < this.numberOfParticles; i++) {
                this.particles.push(new Particle.FlowParticle(this));
            }
        }
    }

    render(context, volume) {
        this.particles.forEach(particle => {
            particle.draw(context);
            particle.updateParticle(volume);
        })
    }
}

module.exports = { FlowEffect }