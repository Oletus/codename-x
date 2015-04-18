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
    
    this.turnNumber = 1; // How many turns have passed (for both players)
    this.currentTurnSide = 0; // Index to Side.Sides
    this.state = Game.State.PRE_TURN;
    
    this.createUI();

    var that = this;
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

Game.State = {
    PRE_TURN: 0, // blank screen so that the players don't see each other's intel
    PLAYING: 1,
    FINISHED: 2
};

Game.prototype.createUI = function() {
    this.uiButtons = [];
    this.playingUI = []; // Contains those buttons that are only visible during the "PLAYING" stage.

    var that = this;
    this.uiButtons.push(new CanvasButton({
        label: 'Next turn',
        centerX: 1800,
        centerY: 1000,
        clickCallback: function() {
            that.nextTurn();
        }
    }));
    var addLocationUI = function(location) {
        var button = new CanvasButton({
            label: location.name,
            centerX: location.x,
            centerY: location.y,
            width: 60,
            height: 60,
            renderFunc: function(ctx, cursorOn, buttonDown, button) {
                location.render(ctx, cursorOn, buttonDown, button);
            }
        });
        that.uiButtons.push(button);
        that.playingUI.push(button);
    };
    for (var i = 0; i < this.locations.length; ++i) {
        addLocationUI(this.locations[i]);
    }
    this.setPlayingUIActive(false);
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
    if (this.state === Game.State.PLAYING) {
        this.bgSprite.fillCanvas(this.ctx);
        for (var i = 0; i < this.connections.length; ++i) {
            this.connections[i].render(this.ctx);
        }
    } else {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    
    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].render(this.ctx, this.cursorX, this.cursorY);
    }
    var side = Side.Sides[this.currentTurnSide];
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = side.color;
    var header;
    if (this.state === Game.State.PRE_TURN) {
        header = 'Get prepared for turn number ' + this.turnNumber + ', playing as ' + side.name + '.';
    } else if (this.state === Game.State.PLAYING) {
        header = 'Turn number ' + this.turnNumber + ', playing as ' + side.name + '.';
    }
    this.ctx.fillText(header, 20, 30);
    return this.ctx;
};

Game.prototype.nextTurn = function() {
    if (this.state == Game.State.PRE_TURN) {
        this.state = Game.State.PLAYING;
        this.setPlayingUIActive(true);
    } else if (this.state == Game.State.PLAYING) {
        ++this.currentTurnSide;
        if (this.currentTurnSide === Side.Sides.length) {
            this.currentTurnSide = 0;
            this.resolveTurn();
        }
        this.state = Game.State.PRE_TURN;
        this.setPlayingUIActive(false);
    }
};

Game.prototype.setPlayingUIActive = function(active) {
    for (var i = 0; i < this.playingUI.length; ++i) {
        this.playingUI[i].active = active;
    }
};

Game.prototype.resolveTurn = function() {
    ++this.turnNumber;
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
