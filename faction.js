'use strict';

var UnitInstance = function(options) {
    var defaults = {
        turnsResearched: 0,
        unitType: null
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

UnitInstance.prototype.advanceResearch = function() {
    ++this.turnsResearched;
    return this.turnsResearched >= this.unitType.researchTime;
};

UnitInstance.prototype.getCompletion = function() {
    return this.turnsResearched / this.unitType.researchTime;
};

UnitInstance.prototype.getTurnsLeft = function() {
    return this.unitType.researchTime - this.turnsResearched;
};

var Faction = function(options) {
    var defaults = {
        side: null,
        currentResearch: [],   // Array of unit instances
        completedResearch: [], // Array of unit types that have been researched
        reserve: [],           // Array of unit types available for use
        researchIntel: [],     // List of unit types the opponent is probably (?) researching
        intelPower: 1,
        researchSlots: 2,
        messageLog: []
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.ui = [];
};

Faction.prototype.startResearch = function(unitType) {
    this.currentResearch.push(new UnitInstance({unitType: unitType}));
    this.messageLog.push('Started research on ' + unitType.name);
};

Faction.prototype.addToReserve = function(unitType) {
    this.reserve.push(unitType);
};

Faction.prototype.startRandomResearch = function() {
    if (this.currentResearch.length < this.researchSlots) {
        var potentials = this.getPotentialResearch();
        if (potentials.length > 0) {
            this.startResearch(potentials[0]);
        }
    }
};

Faction.prototype.removeReserve = function(reserveUnit) {
    for (var i = 0; i < this.reserve.length; i++) {
        if (this.reserve[i] === reserveUnit) {
            this.reserve.splice(i, 1);
            return;
        }
    }
};

Faction.prototype.advanceResearch = function() {
    for (var i = 0; i < this.currentResearch.length;) {
        var res = this.currentResearch[i];
        var completed = res.advanceResearch();
        if (completed) {
            this.completedResearch.push(res.unitType);
            this.addToReserve(res.unitType);
            this.messageLog.push('Completed research on ' + res.unitType.name);
            this.currentResearch.splice(i, 1);
        } else {
            ++i;
        }
    }
};

Faction.prototype.renderResearchButton = function(ctx, cursorOn, buttonDown, i, button) {
    if (this.currentResearch.length > i) {
        var x = button.visualX();
        var y = button.visualY();
        ctx.fillStyle = this.side.color;
        var completion = this.currentResearch[i].getCompletion();
        console.log(completion);
        var barWidth = 200;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 50, y, barWidth, 20);
        ctx.globalAlpha = 1;
        ctx.fillRect(x + 50, y, completion * barWidth, 20);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText('Turns left : ' + this.currentResearch[i].getTurnsLeft(), x + 50 + barWidth, y - 10);

        Unit.renderIcon(ctx, cursorOn, buttonDown, this.side, x, y, this.currentResearch[i].unitType);
    }
};

Faction.prototype.renderReserveButton = function(ctx, cursorOn, buttonDown, i, button) {
    if (this.reserve.length > i) {
        Unit.renderIcon(ctx, cursorOn, buttonDown, this.side, button.visualX(), button.visualY(), this.reserve[i]);
    }
};

Faction.prototype.addUI = function(button) {
    this.ui.push(button);
};

Faction.prototype.showUI = function(show) {
    for (var i = 0; i < this.ui.length; ++i) {
        this.ui[i].active = show;
    }
};

Faction.prototype.render = function(ctx) {
};

/**
 * @return {Array} Array of unit types that are potential research subjects.
 */
Faction.prototype.getPotentialResearch = function() {
    // Start by cloning the full set
    var possibleResearch = [];

    if ( this.completedResearch.length >= 6 ) {
        possibleResearch = filterByTier(Unit.Types, 3);
    }
    else if ( this.completedResearch.length >= 3 ) {
        possibleResearch = filterByTier(Unit.Types, 2);
    }
    else {
        possibleResearch = filterByTier(Unit.Types, 1);
    }

    // Remove all found in current or completed projects
    var currentResearchUnits = [];

    for (var i = 0; i < this.currentResearch.length; ++i) {
        currentResearchUnits.push(this.currentResearch[i].unitType);
    }

    filter(possibleResearch, currentResearchUnits);
    filter(possibleResearch, this.completedResearch);

    // Randomize three projects from remaining set
    shuffle(possibleResearch);

    // Return set of three (0-3 to be exact)
    return possibleResearch.splice(0, 3);
};
