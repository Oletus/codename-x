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

Side.Sides = [
    {
        id: 0,
        name: 'axis',
        color: '#a00'
    },
    {
        id: 1,
        name: 'allied',
        color: '#46f'
    }
];

function getFaction(name) {
	if ( name == 'axis' ) {
		return Side.Sides[0];
	}
	else {
		return Side.Sides[1];
	}
}