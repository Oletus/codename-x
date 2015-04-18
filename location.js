"use strict";

var Location = function(options) {
    var defaults = {
        unit: null, // Unit object
        terrain: null, // an array of strings
        color: null,
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
    var sideAAdvances = 0;
    sideAAdvances += this.locationA.unit.getEffectivenessAgainst(this.locationB.unit, this.locationB.terrain);
    sideAAdvances -= this.locationB.unit.getEffectivenessAgainst(this.locationA.unit, this.locationA.terrain);
    this.sideAAdvantage += sideAAdvances;
};

Connection.prototype.render = function(ctx) {
    ctx.fillStyle = this.locationA.color;
    for (var i = 0; i < this.steps; ++i) {
        var t = (i + 1) / (this.steps + 1);
        var x = mathUtil.mix(this.locationA.x, this.locationB.x, t);
        var y = mathUtil.mix(this.locationA.y, this.locationB.y, t);
        if (i == this.sideAAdvantage) {
            ctx.fillStyle = this.locationB.color;
        }
        ctx.fillRect(x - 5, y - 5, 10, 10);
    }
};
