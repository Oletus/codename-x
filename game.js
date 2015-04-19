'use strict';

var Game = function(canvas) {
    this.bgSprite = new Sprite('background.jpg');
    this.infoPanelsSprite = new Sprite('info_panels.png');
    this.turnPanelSprite = new Sprite('turn_panel.png');
    this.redGlowSprite = new Sprite('red_glow.png');
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
    
    this.potentialResearch = [];
    this.chosenResearch = null;
    
    this.downButton = null;
    this.createUI();

    var that = this;
    this.canvas.addEventListener('mousemove', function(event) {
        that.setCursorPosition(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('touchmove', function(event) {
        that.setCursorPosition(resizer.getCanvasPosition(event));
        event.preventDefault();
    });
    this.canvas.addEventListener('mousedown', function(event) {
        that.click(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('touchstart', function(event) {
        that.click(resizer.getCanvasPosition(event));
        event.preventDefault();
    });
    this.canvas.addEventListener('mouseup', function(event) {
        that.release(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('touchend', function(event) {
        that.release(new Vec2(that.cursorX, that.cursorY));
        event.preventDefault();
    });
    this.setCursorPosition({x: 0, y: 0});
};

Game.State = {
    PRE_TURN: 0, // blank screen so that the players don't see each other's intel
    RESEARCH_PROPOSALS: 1,
    PLAYING: 2,
    FINISHED: 3
};

Game.BackgroundMusic = new Audio('Codename_X_theme');
Game.VictoryMusic = new Audio('Victory_fanfare');

Game.prototype.createUI = function() {
    this.uiButtons = [];
    this.preTurnUI = []; // Contains those buttons that are only visible during the "PRE_TURN" stage.
    this.playingUI = []; // Contains those buttons that are only visible during the "PLAYING" stage.
    this.researchUI = []; // Contains those buttons that are only visible during the "RESEARCH_PROPOSALS" stage.

    var that = this;
    
    this.researchHTML = document.createElement('div');
    this.researchHTML.id = 'researchWrap';
    canvasWrapper.appendChild(this.researchHTML);
    
    this.sidebar = new SideBar();
    this.researchProposals = [];
    for (var i = 0; i < 3; ++i) {
        var proposal = (function(j) {
            return new ResearchProposal(j, function() {
                that.chosenResearch = that.potentialResearch[j];
                for (var k = 0; k < 3; ++k) {
                    if (k != j) {
                        that.researchProposals[k].hilight(false);
                    }
                }
                that.researchProposals[j].hilight(true);
            });
        })(i);
        this.researchProposals.push(proposal);
        this.researchHTML.appendChild(proposal.mainDiv);
    }

    Game.BackgroundMusic.playSingular(true);

    // next turn button
    this.uiButtons.push(new CanvasButton({
        label: '',
        centerX: 1838,
        centerY: 968,
        width: 70,
        height: 70,
        clickCallback: function() {
            that.nextPhase();
        },
        renderFunc: function(ctx, cursorOn, buttonDown, button) {
            var glowAmount = that.nextPhaseGlowAmount();
            if (glowAmount > 0) {
                ctx.globalAlpha = glowAmount;
                that.redGlowSprite.drawRotated(ctx, button.visualX(), button.visualY());
            }
        }
    }));
    
    var fsButton = new CanvasButton({
        label: 'Go Fullscreen',
        centerX: 680,
        centerY: 500,
        width: 200,
        height: 70,
        clickCallback: function() {
            requestFullscreen(document.body);
        }
    });
    this.uiButtons.push(fsButton);
    this.preTurnUI.push(fsButton);

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
        var y = 942;
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
        var perRow = 9;
        for (var i = 0; i < Unit.Types.length; ++i) {
            var button = (function(j) {
                return new CanvasButton({
                    label: 'reserve ' + j,
                    centerX: x + (j % perRow) * 63,
                    centerY: y + Math.floor(j / perRow) * 80 + ((j % perRow) % 2) * 30 - 15,
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
    this.setUIActive(this.playingUI, false);
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
    
    if (this.preturnFade > 0) {
        this.ctx.globalAlpha = this.preturnFade;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    this.ctx.globalAlpha = 1.0;
    this.infoPanelsSprite.fillCanvas(this.ctx);
    
    this.sidebar.render();
    this.researchHTML.style.transform = 'scale(' + resizer.getScale() + ')';
    
    this.ctx.globalAlpha = 1.0;
    this.turnPanelSprite.draw(this.ctx, this.ctx.canvas.width - this.turnPanelSprite.width, this.ctx.canvas.height - this.turnPanelSprite.height);

    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].render(this.ctx, this.cursorX, this.cursorY);
    }
    var side = Side.Sides[this.currentTurnSide];
    if (this.state === Game.State.PRE_TURN) {
        this.ctx.globalAlpha = 1.0;
        var header = 'Get prepared for turn number ' + this.turnNumber + ', playing as ' + side.name + '.';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = side.color;
        this.ctx.font = '30px sans-serif';
        this.ctx.fillText(header, 670, 400);
    }
    return this.ctx;
};

Game.prototype.nextPhase = function() {
    if (this.state == Game.State.PRE_TURN) {
        var currentFaction = this.factions[this.currentTurnSide];
        currentFaction.showUI(true);
        var potentialResearch = currentFaction.getPotentialResearch();
        if (currentFaction.researchSlotAvailable() && potentialResearch.length > 0) {
            this.potentialResearch = potentialResearch;
        }
        this.setUIActive(this.preTurnUI, false);
        if (this.potentialResearch.length > 0) {
            this.state = Game.State.RESEARCH_PROPOSALS;
            for (var i = 0; i < 3; ++i) {
                var res = null;
                if (i < this.potentialResearch.length) {
                    res = this.potentialResearch[i];
                }
                this.researchProposals[i].setUnit(res);
                this.researchProposals[i].hilight(false);
            }
            this.chosenResearch = null;
            this.setUIActive(this.researchUI, true);
        } else {
            this.startPlayingPhase();
        }

        for (var i = 0; i < this.connections.length; ++i) {
            this.connections[i].setCurrentSide(Side.Sides[this.currentTurnSide]);
        }
    } else if (this.state == Game.State.RESEARCH_PROPOSALS) {
        if (this.chosenResearch !== null) {
            this.factions[this.currentTurnSide].startResearch(this.chosenResearch);
            this.potentialResearch = [];
            this.startPlayingPhase();
        }
    } else if (this.state == Game.State.PLAYING) {
        this.factions[this.currentTurnSide].showUI(false);
        ++this.currentTurnSide;
        if (this.currentTurnSide === Side.Sides.length) {
            this.currentTurnSide = 0;
            this.resolveTurn();
        }
        this.sidebar.setUnit(null);
        this.state = Game.State.PRE_TURN;
        this.setUIActive(this.playingUI, false);
        this.setUIActive(this.preTurnUI, true);
    }
};

Game.prototype.startPlayingPhase = function() {
    this.state = Game.State.PLAYING;
    this.setUIActive(this.researchUI, false);
    this.setUIActive(this.playingUI, true);
    for (var i = 0; i < 3; ++i) {
        this.researchProposals[i].setUnit(null);
    }
};

Game.prototype.setUIActive = function(uiGroup, active) {
    for (var i = 0; i < uiGroup.length; ++i) {
        uiGroup[i].active = active;
    }
};

Game.prototype.resolveTurn = function() {
    ++this.turnNumber;

    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].resolveCombat();
    }
    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].advanceResearch();
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
    if (this.state === Game.State.RESEARCH_PROPOSALS) {
        
    }
    if (this.state === Game.State.PLAYING) {
        this.preturnFade -= deltaTime * 3;
        if (this.preturnFade < 0) {
            this.preturnFade = 0;
        }
    }
};

Game.prototype.nextPhaseGlowAmount = function() {
    return Math.sin(this.time * 2) * 0.5 + 0.3;
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
    if (vec !== undefined) {
        this.setCursorPosition(vec);
    }
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
    console.log(this.cursorX, this.cursorY);
};
