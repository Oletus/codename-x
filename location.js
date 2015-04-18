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

Location.prototype.render = function(ctx, cursorOn, buttonDown, button) {
    Unit.renderIcon(ctx, cursorOn, buttonDown, this.side, button.visualX(), button.visualY(), this.unit);
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
    this.lastTurnAEffectiveness = 0;
    this.lastTurnBEffectiveness = 0;
};

Connection.prototype.resolveCombat = function() {
    var locationA = this.locationA,
        locationB = this.locationB;

    var sideAAdvances = 0;

    if (this.isBattleOver()) {
        return;
    }

    this.lastTurnAEffectiveness = locationA.unit.getEffectivenessAgainst(locationB.unit, locationB.terrain);
    sideAAdvances += this.lastTurnAEffectiveness;
    this.lastTurnBEffectiveness = locationB.unit.getEffectivenessAgainst(locationA.unit, locationA.terrain);
    sideAAdvances -= this.lastTurnBEffectiveness;

    this.sideAAdvantage += sideAAdvances;
    if (this.sideAAdvantage < 0) {
        this.sideAAdvantage = 0;
    }
    if (this.sideAAdvantage > this.steps) {
        this.sideAAdvantage = this.steps;
    }
};

Connection.prototype.isBattleOver = function() {
    // Return true if one side has beaten the other
    return this.sideAAdvantage == 0 || this.sideAAdvantage == this.steps;
};

Connection.prototype.update = function(deltaTime) {
};

Connection.prototype.render = function(ctx) {
    ctx.save();
    ctx.fillStyle = this.locationA.side.color;

    var locA = new Vec2(this.locationA.x, this.locationA.y);
    var locB = new Vec2(this.locationB.x, this.locationB.y);
    var dist = locA.distance(locB);
    var arrowLength = dist - 80;
    var stepLength = arrowLength / (this.steps - 1);
    var angle = locA.slope(locB);

    for (var i = 0; i < this.steps; ++i) {
        var t = (40 + stepLength * i) / dist;
        var x = mathUtil.mix(this.locationA.x, this.locationB.x, t);
        var y = mathUtil.mix(this.locationA.y, this.locationB.y, t);

        ctx.translate(x, y);
        ctx.rotate(angle);

        if (i == this.sideAAdvantage) {
            ctx.fillStyle = this.locationB.side.color;
        }
        ctx.fillRect(-6, -6, 12, 12);

        ctx.rotate(-angle);
        ctx.translate(-x, -y);
    }
    ctx.restore();
    
    if (!this.isBattleOver()) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Last turn: ' + this.lastTurnAEffectiveness, locA.x, locA.y - 40);
        ctx.fillText('Last turn: ' + this.lastTurnBEffectiveness, locB.x, locB.y - 40);
    }
};
