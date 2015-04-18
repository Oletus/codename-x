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
        name: 'axis',
        color: '#a00'
    },
    {
        name: 'allies',
        color: '#46f'
    }
];

var Game = function(canvas) {
    this.bgSprite = new Sprite('background.jpg');
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.locations = [];
    this.connections = [];
    for (var i = 0; i < Game.LocationParameters.length; ++i) {
        this.locations.push(new Location(Game.LocationParameters[i]));
    }
    this.time = 0;
    for (var i = 0; i < Game.LocationParameters.length; i += 2) {
        this.connections.push(new Connection({locationA: this.locations[i], locationB: this.locations[i + 1]}));
    }
    
    this.uiButtons = [];

    var that = this;
    this.uiButtons.push(new CanvasButton({
        label: 'Next turn',
        centerX: 1800,
        centerY: 1000,
        clickCallback: function() {
            that.resolveTurn();
        }
    }));

    this.canvas.addEventListener('mousemove', function(event) {
        that.setCursorPosition(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('mousedown', function(event) {
        that.click(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('touchstart', function(event) {
        that.click(resizer.getCanvasPosition(event));
    });
    this.setCursorPosition({x: 0, y: 0});
};

Game.LocationParameters = [
{
    name: 'Britain',
    unit: new Unit(Unit.Types[0]),
    x: 520,
    y: 600,
    side: Side.Sides[1],
    terrain: ['wet']
},
{
    name: 'Germany',
    unit: new Unit(Unit.Types[0]),
    x: 750,
    y: 660,
    side: Side.Sides[0],
    terrain: ['wet']
},
{
    name: 'Russia',
    unit: new Unit(Unit.Types[0]),
    x: 1350,
    y: 400,
    side: Side.Sides[1],
    terrain: ['cold']
},
{
    name: 'Baltics',
    unit: new Unit(Unit.Types[0]),
    x: 1100,
    y: 500,
    side: Side.Sides[0],
    terrain: ['cold']
},
{
    name: 'Greece',
    unit: new Unit(Unit.Types[0]),
    x: 970,
    y: 920,
    side: Side.Sides[1],
    terrain: ['warm']
},
{
    name: 'Italy',
    unit: new Unit(Unit.Types[0]),
    x: 780,
    y: 850,
    side: Side.Sides[0],
    terrain: ['warm']
}
];

Game.prototype.render = function() {
    this.bgSprite.fillCanvas(this.ctx);
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].render(this.ctx);
    }
    for (var i = 0; i < this.locations.length; ++i) {
        this.locations[i].render(this.ctx);
    }
    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].render(this.ctx, this.cursorX, this.cursorY);
    }
    return this.ctx;
};

Game.prototype.resolveTurn = function() {
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].resolveCombat();
    }
};

Game.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};

Game.prototype.setCursorPosition = function(vec) {
    this.cursorX = vec.x;
    this.cursorY = vec.y;
};

Game.prototype.click = function(vec) {
    this.setCursorPosition(vec);
    for (var i = 0; i < this.uiButtons.length; ++i) {
        if (this.uiButtons[i].hitTest(this.cursorX, this.cursorY)) {
            this.uiButtons[i].click();
        }
    }
};
