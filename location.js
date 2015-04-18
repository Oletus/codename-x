"use strict";

var Location = function(options) {
    var defaults = {
        name: '',
        unit: null, // Unit object
        terrain: null, // an array of strings
        side: null,
        connections: [],
        x: 0,
        y: 0
    };
    for (var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

Location.prototype.render = function(ctx, cursorOn, buttonDown) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
    
    ctx.fillStyle = this.side.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    
    ctx.lineWidth = 3;
    if (cursorOn && !buttonDown) {
        ctx.strokeStyle = '#fff';
    } else {
        ctx.strokeStyle = this.side.color;
    }
    ctx.globalAlpha = 1.0;
    ctx.stroke();
};

var Connection = function(options) {
    var defaults = {
        locationA: null,
        locationB: null,
        sideAAdvantage: 5,
        steps: 10
    };
    for (var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.locationA.connections.push(this);
    this.locationB.connections.push(this);
};

Connection.prototype.resolveCombat = function() {
    var locationA = this.locationA,
        locationB = this.locationB;

    var sideAAdvances = 0;

    if (this.isBattleOver()) {
        return;
    }

    sideAAdvances += locationA.unit.getEffectivenessAgainst(locationB.unit, locationB.terrain);
    sideAAdvances -= locationB.unit.getEffectivenessAgainst(locationA.unit, locationA.terrain);

    this.sideAAdvantage += sideAAdvances;
};

Connection.prototype.isBattleOver = function() {
    // Return true if one side has beaten the other
    return this.sideAAdvantage == 0 || this.sideAAdvantage == 10;
};

Connection.prototype.render = function(ctx) {
    ctx.fillStyle = this.locationA.side.color;
    for (var i = 0; i < this.steps; ++i) {
        var locA = new Vec2(this.locationA.x, this.locationA.y);
        var locB = new Vec2(this.locationB.x, this.locationB.y);
        var dist = locA.distance(locB);
        var arrowLength = dist - 80;
        var stepLength = arrowLength / (this.steps - 1);
        var t = (40 + stepLength * i) / dist;
        var x = mathUtil.mix(this.locationA.x, this.locationB.x, t);
        var y = mathUtil.mix(this.locationA.y, this.locationB.y, t);
        if (i == this.sideAAdvantage) {
            ctx.fillStyle = this.locationB.side.color;
        }
        ctx.fillRect(x - 5, y - 5, 10, 10);
    }
};
