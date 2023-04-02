const Particle = require('./flowParticle')

class FlowEffect {

    constructor(canvas, options) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.options = options;
        this.particles = [];
        this.numberOfParticles = options.particles;
        this.cellSize = 20;
        this.rows;
        this.cols;
        this.flowField = [];
        this.curve = 0.3;
        this.zoom = 0.1
        this.counter = 0;
        this.updateEffect(true, 0, this.options);

        window.addEventListener('resize', e => {
            let newWidth = e.target.innerWidth;
            let newHeight = e.target.innerHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            this.width = canvas.width;
            this.height = canvas.height;
            this.updateEffect(false, 0, this.options);
        })
    }

    updateEffect(createParticles, volume, options, particleDiff) {
        this.options = options;
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                let adjustedZoom = this.options.zoom / 100
                let angle = (Math.cos((x + this.counter * -this.options.xAdjustment) * adjustedZoom)
                    + Math.sin((y + this.counter * this.options.yAdjustment) * adjustedZoom)) * (volume * this.options.curve / 100);
                this.flowField.push(angle);
            }
        }
        this.counter += 0.01;

        if (createParticles) {
            let newParticles;
            if (particleDiff || particleDiff === 0) {
                newParticles = particleDiff < 0 ? -particleDiff : 0;
            } else {
                newParticles = options.particles;
            }
            for (let i = 0; i < newParticles; i++) {
                let particle = new Particle.FlowParticle(this);
                particle.reset(volume, options)
                this.particles.push(particle);
            }
        }
    }

    render(context, volume) {
        this.particles.forEach(particle => {
            particle.draw(context);
            particle.updateParticle(volume, this.options);
        })
    }

    clearParticles(particleDiff) {
        if (particleDiff > 0) {
            for (let i = 0; i < particleDiff; i++) {
                let particle = this.particles.shift();
                particle.history = [];
            }
        }
    }
}

module.exports = { FlowEffect }