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
    'armor'
];

Unit.Types = [
    {
        name: 'Conventional army',
        properties: ['land']
    },
    {
        name: 'Fruit bat firebombs',
        against: {'conventional': 1}
    },
    {
        name: 'Anti-tank dogs',
        properties: ['land'],
        against: {'armor': 1}
    },
    {
        name: 'Pigeon guided missiles'
    },
    {
        name: 'Malaria mosquitoes',
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
        name: 'Pheromone gas'
    },
    {
        name: 'Panjandrum'
    },
    {
        name: 'Psychic Dogs'
    },
    {
        name: 'Kamikaze Dolphins',
        properties: ['single use'],
        against: {'land': -1, 'air': -1}
    },
    {
        name: 'Weaponized Transphobia'
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
