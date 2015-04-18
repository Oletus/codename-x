'use strict';

var Game = function(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
};

Game.prototype.render = function() {
    this.ctx.fillStyle = cssUtil.rgbString([0, 0, (Math.sin(this.time) * 0.5 + 0.5) * 255]);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    return this.ctx;
};

Game.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};
