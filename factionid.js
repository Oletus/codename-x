'use strict';

var Side = function(options) {
    var defaults = {
        name: '',
        color: '#000',
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

Side.Id = {
    AXIS: 0,
    ALLIED: 1
};

Side.Sides = [
    {
        id: Side.Id.AXIS,
        name: 'axis',
        color: '#a00'
    },
    {
        id: Side.Id.ALLIED,
        name: 'allied',
        color: '#46f'
    }
];


Side.LocationParameters = [
{
    name: 'Britain',
    x: 325,
    y: 260,
    side: Side.Sides[1],
    terrain: ['wet'],
    steps: 4,
},
{
    name: 'Germany',
    x: 520,
    y: 395,
    side: Side.Sides[0],
    terrain: ['wet'],
    steps: 4,
},
{
    name: 'Russia',
    x: 1095,
    y: 100,
    side: Side.Sides[1],
    terrain: ['cold'],
    terrainAgainst: {'sea': -2},
    steps: 6,
},
{
    name: 'Baltics',
    x: 860,
    y: 210,
    side: Side.Sides[0],
    terrain: ['cold'],
    terrainAgainst: {'sea': -2},
    steps: 6,
},
{
    name: 'Greece',
    x: 1095,
    y: 580,
    side: Side.Sides[1],
    terrain: ['warm'],
    steps: 5
},
{
    name: 'Italy',
    x: 855,
    y: 505,
    side: Side.Sides[0],
    terrain: ['warm'],
    steps: 5
}
];
