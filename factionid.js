'use strict';

var FactionId = {
    AXIS: 0,
    ALLIED: 1
};

var FactionData = [
    {
        id: FactionId.AXIS,
        name: 'axis',
        color: '#a00',
        locations: [
            {
                name: 'Germany',
                x: 520,
                y: 395,
                terrain: ['wet'],
                steps: 4,
            },
            {
                name: 'Baltics',
                x: 860,
                y: 210,
                terrain: ['cold'],
                terrainAgainst: {'sea': -2},
                steps: 6,
            },
            {
                name: 'Italy',
                x: 855,
                y: 505,
                terrain: ['warm'],
                steps: 5
            }
        ]
    },
    {
        id: FactionId.ALLIED,
        name: 'allied',
        color: '#46f',
        locations: [
            {
                name: 'Britain',
                x: 325,
                y: 260,
                terrain: ['wet'],
                steps: 4,
            },
            {
                name: 'Russia',
                x: 1095,
                y: 100,
                terrain: ['cold'],
                terrainAgainst: {'sea': -2},
                steps: 6,
            },
            {
                name: 'Greece',
                x: 1095,
                y: 580,
                terrain: ['warm'],
                steps: 5
            }
        ]
    }
];
