"use strict";

var Location = function(options) {
    var defaults = {
        name: '',
        unit: null, // Unit object
        terrain: null, // an array of strings
        side: null,
        currentSide: null,
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
    this.lastTurnEffectiveness = 0;
    this.lastTurnUnit = null;
    this.animationProgress = 0;
    this.messageLog = [];
};

Location.prototype.getVisibleUnit = function() {
    if (this.lastTurnUnit == null || (this.side == this.currentSide && this.isAnimationComplete())) {
        return this.unit;
    } else {
        return this.lastTurnUnit;
    }
};

Location.prototype.isAnimationComplete = function() {
    return this.animationProgress >= this.messageLog.length;
}

Location.prototype.render = function(ctx, cursorOn, buttonDown, button) {
    var x = button.visualX();
    var y = button.visualY();
    Unit.renderIcon(ctx, cursorOn, buttonDown, this.side, x, y, this.getVisibleUnit(), button);
    var logIndex = Math.floor(this.animationProgress);
    
    var animY = 1.0;
    if (logIndex >= this.messageLog.length) {
        logIndex = this.messageLog.length - 1;
    } else {
        animY = mathUtil.fmod(this.animationProgress, 1.0);
    }
    if (this.animationProgress > 0) {
        ctx.textAlign = 'center';
        ctx.font = '16px special_eliteregular';
        ctx.fillStyle = '#fff'
        ctx.fillText(this.messageLog[logIndex], x, y - animY * 10 - 50);
    }
};

Location.prototype.update = function(deltaTime) {
    this.animationProgress += deltaTime;
};

Location.prototype.resetAnimation = function() {
    this.animationProgress = 0;
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

Connection.prototype.setCurrentSide = function(faction) {
    this.locationA.currentSide = faction;
    this.locationB.currentSide = faction;
}

Connection.prototype.resolveCombat = function() {
    var locationA = this.locationA,
        locationB = this.locationB;

    var sideAAdvances = 0;

    if (this.isBattleOver()) {
        return;
    }

    locationA.messageLog = [];
    locationA.lastTurnEffectiveness = locationA.unit.getEffectivenessAgainst(locationB.unit, locationB.terrain, locationA.messageLog);
    sideAAdvances += locationA.lastTurnEffectiveness;

    locationB.messageLog = [];
    locationB.lastTurnEffectiveness = locationB.unit.getEffectivenessAgainst(locationA.unit, locationA.terrain, locationB.messageLog);
    sideAAdvances -= locationB.lastTurnEffectiveness;

    this.sideAAdvantage += sideAAdvances;
    if (this.sideAAdvantage <= 0) {
        this.sideAAdvantage = 0;
        this.locationA.side = this.locationB.side;
    }
    if (this.sideAAdvantage >= this.steps) {
        this.sideAAdvantage = this.steps;
        this.locationB.side = this.locationA.side;
    }

    this.locationA.lastTurnUnit = this.locationA.unit;
    this.locationB.lastTurnUnit = this.locationB.unit;
};

Connection.prototype.isBattleOver = function() {
    // Return true if one side has beaten the other
    return this.sideAAdvantage == 0 || this.sideAAdvantage == this.steps;
};

Connection.prototype.update = function(deltaTime, state) {
    var animationInProgress = false;
    if (state === Game.State.PLAYING) {
        if (!this.locationA.isAnimationComplete()) {
            this.locationA.update(deltaTime);
            animationInProgress = true;
        } else if (!this.locationB.isAnimationComplete()) {
            this.locationB.update(deltaTime);
            animationInProgress = true;
        }
    }
    return animationInProgress;
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
    
    /*if (!this.isBattleOver()) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px special_eliteregular';
        ctx.textAlign = 'center';
        ctx.fillText('Last turn: ' + this.lastTurnAEffectiveness, locA.x, locA.y - 40);
        ctx.fillText('Last turn: ' + this.lastTurnBEffectiveness, locB.x, locB.y - 40);
    }*/
};
