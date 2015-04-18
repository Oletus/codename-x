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
    this.turnPanelSprite = new Sprite('turn_panel.png');
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
    this.preturnFade = 1;
    this.currentTurnSide = 0; // Index to Side.Sides
    this.state = Game.State.PRE_TURN;
    
    this.downButton = null;
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
};

Game.State = {
    PRE_TURN: 0, // blank screen so that the players don't see each other's intel
    PLAYING: 1,
    FINISHED: 2
};

Game.BackgroundMusic = new Audio('Codename_X_theme');
Game.VictoryMusic = new Audio('Victory_fanfare');

Game.prototype.createUI = function() {
    this.uiButtons = [];
    this.playingUI = []; // Contains those buttons that are only visible during the "PLAYING" stage.

    this.sidebar = new SideBar(this, this.canvas);

    Game.BackgroundMusic.playSingular(true);

    var that = this;
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
            dragTargetFunc: function() {
                that.dragToLocation(location);
            },
            renderFunc: function(ctx, cursorOn, buttonDown, button) {
                location.render(ctx, cursorOn, buttonDown, button);
            },
            clickCallback: function() {
                that.sidebar.setUnit(location.unit);
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
                    draggable: true,
                    renderFunc: function(ctx, cursorOn, buttonDown, button) {
                        faction.renderReserveButton(ctx, cursorOn, buttonDown, j, button);
                    },
                    clickCallback: function() {
                        if (j < faction.reserve.length) {
                            that.sidebar.setUnit(faction.reserve[j]);
                        }
                    },
                    draggedObject: function() {
                        return faction.reserve[j];
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
    x: 325,
    y: 260,
    side: Side.Sides[1],
    terrain: ['wet']
},
{
    name: 'Germany',
    unit: new Unit(Unit.Types[0]),
    x: 520,
    y: 395,
    side: Side.Sides[0],
    terrain: ['wet']
},
{
    name: 'Russia',
    unit: new Unit(Unit.Types[0]),
    x: 1095,
    y: 100,
    side: Side.Sides[1],
    terrain: ['cold']
},
{
    name: 'Baltics',
    unit: new Unit(Unit.Types[0]),
    x: 860,
    y: 210,
    side: Side.Sides[0],
    terrain: ['cold']
},
{
    name: 'Greece',
    unit: new Unit(Unit.Types[0]),
    x: 1095,
    y: 580,
    side: Side.Sides[1],
    terrain: ['warm']
},
{
    name: 'Italy',
    unit: new Unit(Unit.Types[0]),
    x: 855,
    y: 505,
    side: Side.Sides[0],
    terrain: ['warm']
}
];

Game.prototype.render = function() {
    this.bgSprite.fillCanvas(this.ctx);
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].render(this.ctx);
    }

    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].render(this.ctx);
    }
    
    this.sidebar.render();
    
    if (this.preturnFade > 0) {
        this.ctx.globalAlpha = this.preturnFade;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    this.ctx.globalAlpha = 1.0;
    this.turnPanelSprite.draw(this.ctx, this.ctx.canvas.width - this.turnPanelSprite.width, this.ctx.canvas.height - this.turnPanelSprite.height);

    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].render(this.ctx, this.cursorX, this.cursorY);
    }
    var side = Side.Sides[this.currentTurnSide];
    if (this.state === Game.State.PRE_TURN) {
        var header = 'Get prepared for turn number ' + this.turnNumber + ', playing as ' + side.name + '.';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = side.color;
        this.ctx.fillText(header, this.ctx.canvas.width * 0.5, this.ctx.canvas.height * 0.5);
    }
    return this.ctx;
};

Game.prototype.nextTurn = function() {
    if (this.state == Game.State.PRE_TURN) {
        this.factions[this.currentTurnSide].showUI(true);
        this.state = Game.State.PLAYING;
        this.setPlayingUIActive(true);
        this.sidebar.setUnit(null);
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
    if (this.isGameOver()) {
        this.state = Game.State.FINISHED;
        Game.BackgroundMusic.stop();
        Game.VictoryMusic.playSingular();
    }
};

Game.prototype.isGameOver = function() {
    // Return true if the game is over
    var completedBattles = 0;
    for (var i = 0; i < this.connections.length; ++i) {
        if (this.connections[i].isBattleOver()) {
            completedBattles++;
        }
    }
    return completedBattles >= 2;
};

Game.prototype.update = function(deltaTime) {
    this.time += deltaTime;
    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].update(deltaTime);
    }
    if (this.state === Game.State.PRE_TURN) {
        this.preturnFade += deltaTime * 3;
        if (this.preturnFade > 1) {
            this.preturnFade = 1;
        }
    }
    if (this.state === Game.State.PLAYING) {
        this.preturnFade -= deltaTime * 3;
        if (this.preturnFade < 0) {
            this.preturnFade = 0;
        }
    }
};

Game.prototype.setCursorPosition = function(vec) {
    this.cursorX = vec.x;
    this.cursorY = vec.y;
    if (this.downButton !== null && this.downButton.draggable) {
        this.downButton.draggedX = this.downButton.centerX + (this.cursorX - this.dragStartX);
        this.downButton.draggedY = this.downButton.centerY + (this.cursorY - this.dragStartY);
    }
};

Game.prototype.dragToLocation = function(location) {
    if (location.side === Side.Sides[this.currentTurnSide] && this.downButton.draggedObject !== null) {
        var draggedObject = this.downButton.draggedObject();
        this.factions[this.currentTurnSide].reserve.push(location.unit);
        this.factions[this.currentTurnSide].removeReserve(draggedObject);
        location.unit = draggedObject;
    }
};

Game.prototype.click = function(vec) {
    for (var i = 0; i < this.uiButtons.length; ++i) {
        if (this.uiButtons[i].active && this.uiButtons[i].hitTest(this.cursorX, this.cursorY)) {
            this.downButton = this.uiButtons[i];
            if (this.uiButtons[i].draggable) {
                this.downButton.dragged = true;
                this.dragStartX = this.cursorX;
                this.dragStartY = this.cursorY;
            }
        }
    }
    this.setCursorPosition(vec);
};

Game.prototype.release = function(vec) {
    if (this.downButton !== null) {
        for (var i = 0; i < this.uiButtons.length; ++i) {
            if (this.uiButtons[i].active && this.uiButtons[i].hitTest(this.cursorX, this.cursorY)) {
                if (this.downButton === this.uiButtons[i]) {
                    this.uiButtons[i].click();
                } else if (this.uiButtons[i].dragTargetFunc !== null) {
                    this.uiButtons[i].dragTargetFunc();
                }
            }
        }
        this.downButton.dragged = false;
        this.downButton = null;
    }
    console.log(vec.x, vec.y);
    this.setCursorPosition(vec);
};
