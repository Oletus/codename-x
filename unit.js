"use strict";

var Unit = function(options) {
    var defaults = {
        name: '',
        tier: 1,
        researchTime: 1,
        singleUse: false,
        instantVictory: false,
        perfectDefense: false,
        properties: [],
        against: {}
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

Unit.Properties = [
    'air',
    'land',
    'sea',
    'space',
    'conventional',
    'infantry',
    'armor',
    'animal',
    'espionage'
];

Unit.Types = [
    {
        name: 'Conventional army',
        properties: ['land']
    },
    {
        name: 'Fruit bat firebombs',
        singleUse: true,
        properties: ['animal'],
        against: {'conventional': 1}
    },
    {
        name: 'Anti-tank dogs',
        singleUse: true,
        properties: ['animal', 'land'],
        against: {'armor': 1}
    },
    {
        name: 'Pigeon guided missiles',
        singleUse: true,
        properties: ['animal']
    },
    {
        name: 'Malaria mosquitoes',
        properties: ['animal'],
        against: {'infantry': 1, 'cold': -1}
    },
    {
        name: 'Flying tanks',
        properties: ['armor'],
        against: {'air': 1}
    },
    {
        name: 'Triebflügel',
        properties: ['air']
    },
    {
        name: 'Iceberg ships',
        properties: ['sea', 'armor']
    },
    {
        name: 'Meth-fueled infantry',
        properties: ['land', 'infantry']
    },
    {
        name: 'Pheromone gas',
        tier: 2,
        researchTime: 4,
        against: {'animal': 1}
    },
    {
        name: 'Panjandrum',
        tier: 2,
        researchTime: 4,
        properties: ['land']
    },
    {
        name: 'Psychic Dogs',
        tier: 2,
        researchTime: 4,
        properties: ['animal']
    },
    {
        name: 'Kamikaze Dolphins',
        tier: 2,
        researchTime: 4,
        properties: ['animal'],
        against: {'land': -1, 'air': -1}
    },
    {
        name: 'Weaponized Transphobia',
        tier: 2,
        researchTime: 4,
        against: {'animals': -1}
    },
    {
        name: 'Flaming pigs',
        tier: 2,
        researchTime: 4,
        singleUse: true,
        properties: ['land'],
        against: {'wet': -1}
    },
    {
        name: '"Who? Me?" stench weapon',
        tier: 2,
        researchTime: 4,
        against: {'armor': 1, 'air': -1}
    },
    {
        name: 'Acoustic kitty',
        tier: 2,
        researchTime: 4,
        properties: ['land', 'animal', 'espionage']
    },
    {
        name: 'Soup Bowl War Ship',
        tier: 2,
        researchTime: 4,
        properties: ['sea']
    },
    {
        name: 'Space spyglass',
        tier: 3,
        researchTime: 6,
        instantVictory: true,
        properties: ['space']
    },
    {
        name: 'Chicken-warmed nuclear landmines',
        tier: 3,
        researchTime: 6,
        perfectDefense: true,
        properties: ['animal', 'land']
    }
];

Unit.prototype.getEffectivenessAgainst = function(unitB, terrain) {
    var effectiveness = this.tier;
    for (var i = 0; i < unitB.properties.length; ++i) {
        var property = unitB.properties[i];
        if (this.against.hasOwnProperty(unitB[property])) {
            effectiveness += this.against[property];
        }
    }
    for (var i = 0; i < terrain.length; ++i) {
        var property = terrain[i];
        if (this.against.hasOwnProperty(property)) {
            effectiveness += this.against[property];
        }
    }
    return effectiveness;
};
