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
    this.factions = [];
    for (var i = 0; i < Game.LocationParameters.length; ++i) {
        this.locations.push(new Location(Game.LocationParameters[i]));
    }
    this.time = 0;
    for (var i = 0; i < Game.LocationParameters.length; i += 2) {
        this.connections.push(new Connection({locationA: this.locations[i], locationB: this.locations[i + 1]}));
    }
    for (var i = 0; i < Side.Sides.length; ++i) {
        this.factions.push(new Faction({side: Side.Sides[i]}));
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
    this.canvas.addEventListener('mouseup', function(event) {
        that.release(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('touchend', function(event) {
        that.release(resizer.getCanvasPosition(event));
    });
    this.setCursorPosition({x: 0, y: 0});
    
    this.dragged = null;
    this.downButton = null;
};

Game.State = {
    PRE_TURN: 0, // blank screen so that the players don't see each other's intel
    PLAYING: 1,
    FINISHED: 2
};

Game.prototype.createUI = function() {
    this.uiButtons = [];
    this.playingUI = []; // Contains those buttons that are only visible during the "PLAYING" stage.

    this.sidebar = new SideBar(this, this.canvas);

    var that = this;
    this.uiButtons.push(this.sidebar);
    this.playingUI.push(this.sidebar);
    this.uiButtons.push(new CanvasButton({
        label: '',
        centerX: 1840,
        centerY: 970,
        width: 60,
        height: 70,
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

    var addFactionUI = function(faction) {
        var x = 1000;
        var y = 920;
        for (var i = 0; i < faction.researchSlots; ++i) {
            var button = (function(j) {
                return new CanvasButton({
                    label: 'research ' + j,
                    centerX: x,
                    centerY: y + j * 80,
                    width: 60,
                    height: 60,
                    active: false,
                    renderFunc: function(ctx, cursorOn, buttonDown, button) {
                        faction.renderResearchButton(ctx, cursorOn, buttonDown, j, button);
                    },
                    clickCallback: function() {
                        if (j < faction.currentResearch.length) {
                            that.sidebar.setUnit(faction.currentResearch[j].unitType);
                        }
                    }
                });
            })(i);
            that.uiButtons.push(button);
            faction.addUI(button);
        }
        x = 60;
        for (var i = 0; i < Unit.Types.length; ++i) {
            var button = (function(j) {
                return new CanvasButton({
                    label: 'reserve ' + j,
                    centerX: x + (j % 10) * 70,
                    centerY: y + Math.floor(j / 10) * 80 + (j % 2) * 30 - 15,
                    width: 60,
                    height: 60,
                    active: false,
                    renderFunc: function(ctx, cursorOn, buttonDown, button) {
                        faction.renderReserveButton(ctx, cursorOn, buttonDown, j, button);
                    },
                    clickCallback: function() {
                        if (j < faction.reserve.length) {
                            that.sidebar.setUnit(faction.reserve[j]);
                        }
                    }
                });
            })(i);
            that.uiButtons.push(button);
            faction.addUI(button);
        }
    };
    for (var i = 0; i < this.factions.length; ++i) {
        addFactionUI(this.factions[i]);
    }
    this.setPlayingUIActive(false);
};

Game.LocationParameters = [
{
    name: 'Britain',
    unit: new Unit(Unit.Types[0]),
    x: 330,
    y: 260,
    side: Side.Sides[1],
    terrain: ['wet']
},
{
    name: 'Germany',
    unit: new Unit(Unit.Types[0]),
    x: 500,
    y: 400,
    side: Side.Sides[0],
    terrain: ['wet']
},
{
    name: 'Russia',
    unit: new Unit(Unit.Types[0]),
    x: 1080,
    y: 120,
    side: Side.Sides[1],
    terrain: ['cold']
},
{
    name: 'Baltics',
    unit: new Unit(Unit.Types[0]),
    x: 860,
    y: 230,
    side: Side.Sides[0],
    terrain: ['cold']
},
{
    name: 'Greece',
    unit: new Unit(Unit.Types[0]),
    x: 1080,
    y: 580,
    side: Side.Sides[1],
    terrain: ['warm']
},
{
    name: 'Italy',
    unit: new Unit(Unit.Types[0]),
    x: 850,
    y: 500,
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

    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].render(this.ctx);
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
    this.ctx.fillText(header, 1450, 800);
    return this.ctx;
};

Game.prototype.nextTurn = function() {
    if (this.state == Game.State.PRE_TURN) {
        this.factions[this.currentTurnSide].showUI(true);
        this.state = Game.State.PLAYING;
        this.setPlayingUIActive(true);
    } else if (this.state == Game.State.PLAYING) {
        this.factions[this.currentTurnSide].showUI(false);
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
    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].advanceResearch();

        // TODO: This is just for debug, remove this.
        this.factions[i].startRandomResearch();
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
            this.downButton = this.uiButtons[i];
            this.dragged = this.uiButtons[i];
            this.downButton.dragged = true;
        }
    }
};

Game.prototype.release = function(vec) {
    this.setCursorPosition(vec);
    if (this.downButton !== null) {
        for (var i = 0; i < this.uiButtons.length; ++i) {
            if (this.uiButtons[i].hitTest(this.cursorX, this.cursorY)) {
                if (this.downButton === this.uiButtons[i]) {
                    this.uiButtons[i].click();
                }
            }
        }
        this.downButton.dragged = false;
        this.downButton = null;
    }
    console.log(vec.x, vec.y);
};
