class FlowProfile {
    constructor(options) {
        this.hue = options.hue;
        this.hueShift = options.hueShift;
        this.volume = options.volume;
        this.zoom = options.zoom;
        this.xAdjustment = options.xAdjustment;
        this.yAdjustment = options.yAdjustment;
        this.scrollSpeed = options.scrollSpeed;
        this.speed = options.speed;
        this.bassMode = options.bassMode;
    }
}

module.exports = { FlowProfile };