class FlowParticle {

    constructor(effect) {
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        this.speedModifier = 2;
        this.history = [{ x: this.x, y: this.y }];
        this.maxLength = Math.floor(Math.random() * 70 + 50);
        this.angle = 0;
        this.timer = this.maxLength * 2;
        this.hue = this.effect.options.hue;
        this.colours;
        this.colour;
        this.lineWidth = this.effect.options.lineWidth;
    }

    draw(context) {
        context.lineWidth = this.lineWidth;
        context.strokeStyle = this.colour;
        context.beginPath();
        context.moveTo(this.history[0].x, this.history[0].y)
        for (let i = 0; i < this.history.length; i++) {
            context.lineTo(this.history[i].x, this.history[i].y);
        }
        context.stroke();

    }

    updateParticle(volume, options) {
        this.options = options
        this.timer--;
        if (this.timer >= 1) {
            let x = Math.floor(this.x / this.effect.cellSize);
            let y = Math.floor(this.y / this.effect.cellSize);
            let index = y * this.effect.cols + x;
            this.angle = this.effect.flowField[index];

            switch (options.direction) {
                case 'up':
                    this.speedX = Math.sin(this.angle);
                    this.speedY = -Math.cos(this.angle);
                    break;
                case 'down':
                    this.speedX = Math.sin(this.angle);
                    this.speedY = Math.cos(this.angle);
                    break;
                case 'left':
                    this.speedX = -Math.cos(this.angle);
                    this.speedY = Math.sin(this.angle);
                    break;
                case 'right':
                    this.speedX = Math.cos(this.angle);
                    this.speedY = Math.sin(this.angle);
                    break;
            }

            let randomSpeed = Math.floor(Math.random() * this.effect.options.speed * 10) + 10;
            this.x += this.speedX * (volume * randomSpeed + 0.5)
            this.y += this.speedY * (volume * randomSpeed + 0.5)

            this.history.push({ x: this.x, y: this.y });

            if (this.history.length > this.maxLength) {
                this.history.shift();
            }

        } else if (this.history.length > 1) {
            this.history.shift();

        } else {
            this.reset(volume, options);
        }

    }

    reset(volume, options) {
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.hue = volume * 10 * Number(this.effect.options.hueShift) + Number(this.effect.options.hue)
        this.colours = [`hsl( ${this.hue}, 100%, 30%, 0.9)`, `hsl( ${this.hue},100%,40%, 0.9)`, `hsl( ${this.hue},100%, 50%, 0.9)`];
        this.colour = this.colours[Math.floor(Math.random() * this.colours.length)]
        this.history = [{ x: this.x, y: this.y }];
        this.timer = this.maxLength;
        this.lineWidth = options.lineWidth;
    }

}

module.exports = { FlowParticle }