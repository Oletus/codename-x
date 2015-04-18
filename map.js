"use strict";

var mapData = [
    '      MLLL  L',
    '   M  MLL LLL',
    '    L  LL  LL',
    '  L L  L  LLL',
    '  L L LLLLLLL',
    '     LLLLLLLL',
    '   LLLLLLLLLL',
    '   LLLMMMLLLL',
    '    LLLL LLL ',
    '  LML  L LLL ',
    '  LLL   L L L',
    '  LL        L',
    '     LLL     '
];

var MapTile = function(typeStr) {
    this.typeStr = typeStr;
};

MapTile.prototype.render = function() {
    
};

/**
 * @constructor
 */
var Map = function() {
    this.tiles = [];
    for (var i = 0; i < mapData.length; ++i) {
        var row = mapData[i];
        var tilesRow = [];
        for (var j = 0; j < row.length; ++j) {
            
        }
        this.tiles.push(tilesRow);
    }
};