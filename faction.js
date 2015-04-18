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

var Faction = function(options) {
    var defaults = {
        side: null,
        currentResearch: [],   // Array of unit instances
        completedResearch: [], // Array of unit types that have been researched
        reserve: [],           // Array of unit types available for use
        researchIntel: [],     // List of unit types the opponent is probably (?) researching
        intelPower: 1
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
    this.currentResearch.push_back(unitType);
};

Faction.prototype.addToReserve = function(unitType) {
    this.reserve.push_back(unitType);
};

Faction.prototype.advanceResearch = function() {
};

Faction.prototype.render = function(ctx) {
};

/**
 * @return {Array} Array of unit types that are potential research subjects.
 */
Faction.prototype.getPotentialResearch = function() {
};
