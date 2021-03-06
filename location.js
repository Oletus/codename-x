"use strict";

var Location = function(options) {
    var defaults = {
        name: '',
        unit: null, // Unit object
        terrain: [], // an array of strings
        terrainAgainst: {},
        steps: 1,
        connections: [],
        x: 0,
        y: 0
    };
    objectUtil.initWithDefaults(this, defaults, options);

    if (this.unit === null) {
        this.unit = new Unit(Unit.Types[0]);
    }
    this.lastTurnEffectiveness = 0;
    this.lastTurnUnit = this.unit;
    this.faction = null;
    this.lastTurnFaction = null;
    this.currentFaction = null; // faction which has the turn
    this.animationProgress = 0;
    this.messageLog = [];
};

Location.prototype.setFaction = function(faction) {
    this.faction = faction;
    if (this.lastTurnFaction === null) {
        this.lastTurnFaction = faction;
    }
};

Location.prototype.setCurrentFaction = function(currentFaction) {
    this.currentFaction = currentFaction;
};

Location.prototype.getVisibleUnit = function() {
    if (!this.connections[0].animationInProgress && this.isAnimationComplete()) {
        if (this.faction === this.currentFaction) {
            return this.unit;
        } else {
            return Unit.Types[1]; // Unknown unit
        }
    } else {
        return this.lastTurnUnit;
    }
};

Location.prototype.getVisibleFaction = function() {
    if (!this.connections[0].animationInProgress && this.isAnimationComplete()) {
        return this.faction;
    } else {
        return this.lastTurnFaction;
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

Location.prototype.render = function(ctx, button, cursorOn, pressedExtent) {
    var x = button.visualX();
    var y = button.visualY();
    Unit.renderIcon(ctx, cursorOn, pressedExtent, this.getVisibleFaction(), x, y, this.getVisibleUnit(), button);

    var logIndex = Math.floor(this.animationProgress);

    var animY = 1.0;
    if (logIndex >= this.messageLog.length) {
        logIndex = this.messageLog.length - 1;
    } else {
        animY = mathUtil.fmod(this.animationProgress, 1.0);
    }
    if (this.animationProgress > 0 && logIndex >= 0 && !button.isDragged()) {
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
    objectUtil.initWithDefaults(this, defaults, options);

    if (this.sideAAdvantage === undefined) {
        this.sideAAdvantage = Math.floor(this.steps / 2);
    }
    this.lastTurnAAdvantage = this.sideAAdvantage;
    this.battleWasOverLastTurn = false;
    this.locationA.connections.push(this);
    this.locationB.connections.push(this);
    this.changeAnimation = 0;
};

Connection.prototype.resolveCombat = function() {
    var locationA = this.locationA,
        locationB = this.locationB;

    locationA.messageLog = [];
    locationB.messageLog = [];
    
    locationA.lastTurnFaction = locationA.faction;
    locationB.lastTurnFaction = locationB.faction;
    locationA.lastTurnUnit = locationA.unit;
    locationB.lastTurnUnit = locationB.unit;
    this.lastTurnAAdvantage = this.sideAAdvantage;

    if (this.isBattleOver()) {
        this.battleWasOverLastTurn = true;
        return;
    }

    var sideAAdvances = 0;
    locationA.lastTurnEffectiveness = locationA.unit.getEffectivenessAgainst(locationB.unit, locationB.terrain, locationB.terrainAgainst, locationA.messageLog);
    sideAAdvances += locationA.lastTurnEffectiveness;
    locationB.lastTurnEffectiveness = locationB.unit.getEffectivenessAgainst(locationA.unit, locationA.terrain, locationA.terrainAgainst, locationB.messageLog);
    sideAAdvances -= locationB.lastTurnEffectiveness;

    this.sideAAdvantage += sideAAdvances;
    if (this.sideAAdvantage <= 0) {
        this.sideAAdvantage = 0;
        this.locationA.faction = this.locationB.faction;
    }
    if (this.sideAAdvantage >= this.steps) {
        this.sideAAdvantage = this.steps;
        this.locationB.faction = this.locationA.faction;
    }
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
    if (state === Game.State.PLAYING || state === Game.State.FINISHED && !this.battleWasOverLastTurn) {
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
            ctx.fillStyle = this.locationB.getVisibleFaction().color;
        } else {
            ctx.fillStyle = this.locationA.getVisibleFaction().color;
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
