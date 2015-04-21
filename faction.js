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
    this.animatedCompletion = 0;
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
        intelPower: 2,
        researchSlots: 2,
        messageLog: [],
        aiControlled: false,
        locations: []
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.ui = [];
    this.accumulatedIntelPower = 0;
    this.intelOnSide = null;
};

Faction.prototype.startResearch = function(unitType) {
    this.currentResearch.push(new UnitInstance({unitType: unitType}));
    this.messageLog.push('Started research on ' + unitType.name);
};

Faction.prototype.addToReserve = function(unitType) {
    this.reserve.push(unitType);
    this.sortReserve();
};

Faction.prototype.researchSlotAvailable = function() {
    // Only let player to start one research per turn.
    var startedResearchThisTurn = this.currentResearch.length >= 1 &&
        this.currentResearch[this.currentResearch.length - 1].turnsResearched === 0;
    return this.currentResearch.length < this.researchSlots && !startedResearchThisTurn;
};

Faction.prototype.removeReserve = function(reserveUnit) {
    for (var i = 0; i < this.reserve.length; i++) {
        if (this.reserve[i] === reserveUnit) {
            this.reserve.splice(i, 1);
            return;
        }
    }
};

Faction.prototype.getCheapestReserveUnit = function() {
    var minTier = 5;
    var minUnit;
    for (var i = 0; i < this.reserve.length; ++i) {
        if (this.reserve[i].tier < minTier) {
            minTier = this.reserve[i].tier;
            minUnit = this.reserve[i];
        }
    }
    return minUnit;
};

// Once per turn
Faction.prototype.advanceResearch = function() {
    for (var i = 0; i < this.currentResearch.length;) {
        var res = this.currentResearch[i];
        res.advanceResearch();
        ++i;
    }
};

Faction.prototype.getCurrentIntelPower = function() {
    // If intel units are in reserve, they are only half as effective.
    var intelPower = this.intelPower;
    for (var i = 0; i < this.reserve.length; ++i) {
        intelPower += this.reserve[i].intelPower / 2;
    }
    for (var i = 0; i < this.locations.length; ++i) {
        intelPower += this.locations[i].unit.intelPower;
    }
    return intelPower;
};

// Once per turn
Faction.prototype.updateIntel = function(opponentFaction) {
    this.researchIntel = [];
    this.intelOnSide = opponentFaction.side;

    this.accumulatedIntelPower += this.getCurrentIntelPower();

    var discoveredIndex = 0;
    var opponentResearch = arrayUtil.shuffle(opponentFaction.currentResearch);
    while (this.accumulatedIntelPower > 4 && opponentResearch.length > discoveredIndex) {
        this.researchIntel.push(opponentResearch[discoveredIndex].unitType);
        this.accumulatedIntelPower -= 4;
        ++discoveredIndex;
    }
};

Faction.prototype.sortReserve = function() {
    this.reserve.sort(function(a, b) {
        if (a.tier < b.tier) {
            return -1;
        } else if (a.tier > b.tier) {
            return 1;
        } else {
            return 0;
        }
    });
};

/** 
 * @param {number} deltaTime Time passed in seconds. If undefined, effects will be resolved instantly for AI turn.
 * @return {boolean} True if animations are still in progress.
 */
Faction.prototype.update = function(deltaTime, state) {
    var animationsInProgress = false;
    if (state === Game.State.PLAYING || state === Game.State.RESEARCH_PROPOSALS) {
        for (var i = 0; i < this.currentResearch.length;) {
            var res = this.currentResearch[i];
            var completed = false;
            if (deltaTime === undefined) {
                // AI turn update
                completed = res.getCompletion() >= 1;
            } else {
                if (res.animatedCompletion < res.getCompletion()) {
                    res.animatedCompletion += deltaTime / res.unitType.researchTime;
                    if (res.animatedCompletion >= res.getCompletion()) {
                        res.animatedCompletion = res.getCompletion();
                        if (res.animatedCompletion >= 1) {
                            completed = true;
                        }
                    } else {
                        animationsInProgress = true;
                        break;
                    }
                }
            }
            if (completed) {
                if (this.completedResearch.indexOf(res.unitType) < 0) {
                    this.completedResearch.push(res.unitType);
                }
                this.messageLog.push('Completed research on ' + res.unitType.name);
                this.currentResearch.splice(i, 1);
                this.addToReserve(res.unitType);
            } else {
                ++i;
            }
        }
    }
    return animationsInProgress;
};

Faction.prototype.renderResearchButton = function(ctx, cursorOn, buttonDown, i, button) {
    if (this.currentResearch.length > i) {
        var x = button.visualX();
        var y = button.visualY();
        ctx.fillStyle = this.side.color;
        var completion = this.currentResearch[i].animatedCompletion;
        var barWidth = 200;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 50, y, barWidth, 20);
        ctx.fillStyle = '#fff'
        ctx.globalAlpha = 1;
        ctx.fillRect(x + 50, y + 5, completion * barWidth, 10);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.font = '16px special_eliteregular';
        ctx.fillText('Turns left : ' + this.currentResearch[i].getTurnsLeft(), x + 50 + barWidth, y - 10);

        Unit.renderIcon(ctx, cursorOn, buttonDown, this.side, x, y, this.currentResearch[i].unitType, button);
    }
};

Faction.prototype.renderReserveButton = function(ctx, cursorOn, buttonDown, i, button) {
    if (this.reserve.length > i) {
        Unit.renderIcon(ctx, cursorOn, buttonDown, this.side, button.visualX(), button.visualY(), this.reserve[i], button);
    }
};

Faction.prototype.renderIntelButton = function(ctx, cursorOn, buttonDown, i, button) {
    if (this.researchIntel.length > i) {
        Unit.renderIcon(ctx, cursorOn, buttonDown, this.intelOnSide, button.visualX(), button.visualY(), this.researchIntel[i], button);
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

    // Filter out units exclusively defined for another faction.
    for ( var i = 0; i < possibleResearch.length; ) {
        if ( possibleResearch[i].exclusiveFaction === null || possibleResearch[i].exclusiveFaction == this.side ) {
            i++;
        }
        else {
            possibleResearch.splice(i, 1);
        }
    }

    // Remove all found in current projects
    var currentResearchUnits = [];
    for (var i = 0; i < this.currentResearch.length; ++i) {
        currentResearchUnits.push(this.currentResearch[i].unitType);
    }
    possibleResearch = arrayUtil.filterArray(possibleResearch, currentResearchUnits);
    
    // Remove units found in completed projects
    // Single-use units might reappear unless they are in the reserve
    var completedResearchMultiUse = [];
    var completedResearchSingleUse = [];
    for (var i = 0; i < this.completedResearch.length; ++i) {
        var res = this.completedResearch[i];
        if (res.singleUse) {
            completedResearchSingleUse.push(res);
        } else {
            completedResearchMultiUse.push(res);
        }
    }
    possibleResearch = arrayUtil.filterArray(possibleResearch, completedResearchMultiUse);
    possibleResearch = arrayUtil.filterArray(possibleResearch, completedResearchSingleUse);

    var singleUseProjectsLeft = 0;
    for (var i = 0; i < possibleResearch.length; ++i) {
        if (possibleResearch[i].singleUse) {
            ++singleUseProjectsLeft;
        }
    }

    if (this.completedResearch.length >= 3 && singleUseProjectsLeft < 3) {
        // Add some single-use projects back to potential research if they are not in the reserve
        possibleResearch = arrayUtil.filterArray(completedResearchSingleUse, this.reserve);
        completedResearchSingleUse = arrayUtil.shuffle(completedResearchSingleUse);
        var i = 0;
        while (i < completedResearchSingleUse.length && singleUseProjectsLeft + i < 3) {
            possibleResearch.push(completedResearchSingleUse[i]);
            ++i;
        }
    }

    // Randomize three projects from remaining set
    return arrayUtil.randomSubset(possibleResearch, 3);
};
