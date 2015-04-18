'use strict';

var UnitInstance = function() {
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
    return this.turnsResearched >= unitType.researchTime;
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

Faction.prototype.render = function(ctx) {
};

/**
 * @return {Array} Array of unit types that are potential research subjects.
 */
Faction.prototype.getPotentialResearch = function() {
    // Start with full set
    var possibleResearch = Unit.Types;

    // Remove all found in current or completed projects
    filter(possibleResearch, this.currentResearch);
    filter(possibleResearch, this.completedResearch);

    // Randomize three projects from remaining set
    shuffle(possibleResearch);

    // Return set of three (0-3 to be exact)
    return possibleResearch.splice(0, 3);
};
