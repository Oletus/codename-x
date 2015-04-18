'use strict';

var Game = function(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.locations = [];
    this.connections = [];
    for (var i = 0; i < Game.LocationParameters.length; ++i) {
        this.locations.push(new Location(Game.LocationParameters[i]));
    }
    this.time = 0;
    for (var i = 0; i < Game.LocationParameters.length; i += 2) {
        this.connections.push(new Connection({locationA: this.locations[i], locationB: this.locations[i + 1]}));
    }
};

Game.LocationParameters = [
{
    unit: new Unit(Unit.Types[0]),
    x: 100,
    y: 200,
    color: '#00f'
},
{
    unit: new Unit(Unit.Types[0]),
    x: 100,
    y: 400,
    color: '#f00'
}
];

Game.prototype.render = function() {
    this.ctx.fillStyle = cssUtil.rgbString([100, 200, 255]);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].render(this.ctx);
    }
    return this.ctx;
};

Game.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};
