"use strict";

var Location = function(options) {
    var defaults = {
        name: '',
        unit: null, // Unit object
        terrain: [], // an array of strings
        terrainAgainst: {},
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
    this.lastTurnUnit = this.unit;
    this.lastTurnSide = this.side;
    this.animationProgress = 0;
    this.messageLog = [];
};

Location.prototype.getVisibleUnit = function() {
    if (!this.connections[0].animationInProgress && this.isAnimationComplete()) {
        if (this.side === this.currentSide) {
            return this.unit;
        } else {
            return Unit.Types[1]; // Unknown unit
        }
    } else {
        return this.lastTurnUnit;
    }
};

Location.prototype.getVisibleSide = function() {
    if (!this.connections[0].animationInProgress && this.isAnimationComplete()) {
        return this.side;
    } else {
        return this.lastTurnSide;
    }
};

Location.prototype.resetAnimation = function() {
    this.animationProgress = 0;
};

Location.prototype.skipAnimation = function() {
    this.animationProgress = this.messageLog.length;
};

Location.prototype.isAnimationComplete = function() {
    return this.animationProgress >= this.messageLog.length;
};

Location.prototype.render = function(ctx, cursorOn, buttonDown, button) {
    var x = button.visualX();
    var y = button.visualY();
    Unit.renderIcon(ctx, cursorOn, buttonDown, this.getVisibleSide(), x, y, this.getVisibleUnit(), button);

    var logIndex = Math.floor(this.animationProgress);

    var animY = 1.0;
    if (logIndex >= this.messageLog.length) {
        logIndex = this.messageLog.length - 1;
    } else {
        animY = mathUtil.fmod(this.animationProgress, 1.0);
    }
    if (this.animationProgress > 0 && logIndex >= 0) {
        ctx.textAlign = 'center';
        ctx.font = '16px special_eliteregular';
        ctx.fillStyle = '#fff'
        ctx.fillText(this.messageLog[logIndex], x, y - animY * 10 - 50);
    }
};

Location.prototype.update = function(deltaTime) {
    this.animationProgress += deltaTime;
};

var Connection = function(options) {
    var defaults = {
        locationA: null,
        locationB: null,
        sideAAdvantage: undefined,
        steps: 10
    };
    for (var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    if (this.sideAAdvantage === undefined) {
        this.sideAAdvantage = Math.floor(this.steps / 2);
    }
    this.lastTurnAAdvantage = this.sideAAdvantage;
    this.battleWasOverLastTurn = false;
    this.locationA.connections.push(this);
    this.locationB.connections.push(this);
    this.changeAnimation = 0;
};

Connection.prototype.setCurrentSide = function(faction) {
    this.locationA.currentSide = faction;
    this.locationB.currentSide = faction;
};

Connection.prototype.resolveCombat = function() {
    var locationA = this.locationA,
        locationB = this.locationB;

    locationA.messageLog = [];
    locationB.messageLog = [];

    if (this.isBattleOver()) {
        this.battleWasOverLastTurn = true;
        return;
    }

    var sideAAdvances = 0;
    locationA.lastTurnEffectiveness = locationA.unit.getEffectivenessAgainst(locationB.unit, locationB.terrain, locationB.terrainAgainst, locationA.messageLog);
    sideAAdvances += locationA.lastTurnEffectiveness;
    locationB.lastTurnEffectiveness = locationB.unit.getEffectivenessAgainst(locationA.unit, locationA.terrain, locationA.terrainAgainst, locationB.messageLog);
    sideAAdvances -= locationB.lastTurnEffectiveness;

    this.lastTurnAAdvantage = this.sideAAdvantage;
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

Connection.prototype.resetAnimation = function() {
    this.changeAnimation = 0;
};

Connection.prototype.skipAnimation = function() {
    this.changeAnimation = 1;
};

Connection.prototype.update = function(deltaTime, state) {
    this.animationInProgress = false;
    if (state === Game.State.PLAYING && !this.battleWasOverLastTurn) {
        if (!this.locationA.isAnimationComplete()) {
            this.locationA.update(deltaTime);
            this.animationInProgress = true;
        } else if (!this.locationB.isAnimationComplete()) {
            this.locationB.update(deltaTime);
            this.animationInProgress = true;
        } else {
            this.changeAnimation += deltaTime;
            if (this.lastTurnAAdvantage == this.sideAAdvantage) {
                this.changeAnimation += deltaTime * 4;
            }
            if (this.changeAnimation < 1) {
                this.animationInProgress = true;
            }
        }
    }
    return this.animationInProgress;
};

Connection.prototype.render = function(ctx) {
    ctx.save();
    ctx.fillStyle = this.locationA.side.color;

    var locA = new Vec2(this.locationA.x, this.locationA.y);
    var locB = new Vec2(this.locationB.x, this.locationB.y);
    var dist = locA.distance(locB);
    var arrowLength = dist - 80;
    var stepLength = arrowLength / (this.steps - 1);
    var angle = locA.slopeAngle(locB);
    
    var displayedAdvantage = this.lastTurnAAdvantage;
    if (this.changeAnimation >= 1) {
        displayedAdvantage = this.sideAAdvantage;
    } 

    for (var i = 0; i < this.steps; ++i) {
        var t = (40 + stepLength * i) / dist;
        var x = mathUtil.mix(this.locationA.x, this.locationB.x, t);
        var y = mathUtil.mix(this.locationA.y, this.locationB.y, t);

        ctx.translate(x, y);
        ctx.rotate(angle);

        if (i >= displayedAdvantage) {
            ctx.fillStyle = this.locationB.getVisibleSide().color;
        } else {
            ctx.fillStyle = this.locationA.getVisibleSide().color;
        }
        ctx.fillRect(-6, -6, 12, 12);
        
        if ((i < this.sideAAdvantage && i >= this.lastTurnAAdvantage ||
            i < this.lastTurnAAdvantage && i >= this.sideAAdvantage) &&
            this.changeAnimation < 1)
        {
            ctx.globalAlpha = -Math.cos(this.changeAnimation * 6 * Math.PI) * 0.5 + 0.5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(-6, -6, 12, 12);
            ctx.globalAlpha = 1.0;
        }

        ctx.rotate(-angle);
        ctx.translate(-x, -y);
    }
    ctx.restore();
};
