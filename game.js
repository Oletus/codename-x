'use strict';

var Game = function(canvas) {
    this.bgSprite = new Sprite('background.jpg');
    this.infoPanelsSprite = new Sprite('info_panels.png');
    this.turnPanelSprite = new Sprite('turn_panel.png');
    this.redGlowSprite = new Sprite('red_glow.png');
    this.blueGlowSprite = new Sprite('red_glow.png', '#ff8');
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
        var steps = Game.LocationParameters[i].steps + Game.LocationParameters[i + 1].steps;
        var a = this.locations[i];
        var b = this.locations[i + 1];
        this.connections.push(new Connection({locationA: a, locationB: b, steps: steps}));
    }
    for (var i = 0; i < Side.Sides.length; ++i) {
        this.factions.push(new Faction({side: Side.Sides[i]}));
    }
    
    this.turnNumber = 0; // How many turns have passed (for both players)
    this.preturnFade = 1;
    this.researchFade = 0;
    this.currentTurnSide = 0; // Index to Side.Sides
    this.state = Game.State.PRE_TURN;
    
    this.potentialResearch = [];
    this.chosenResearch = null;
    this.researchGlowAmount = 0; // visual glow for the research button;
    
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

    this.resolveTurn();
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
    this.reserveUI = [];

    var that = this;
    
    this.researchHTML = document.createElement('div');
    this.researchHTML.id = 'researchWrap';
    this.researchHTML.style.display = 'none';
    canvasWrapper.appendChild(this.researchHTML);
    
    this.sidebar = new SideBar();
    this.researchProposals = [];
    this.researchHTML.innerHTML = '<h1>RESEARCH PROPOSALS</h1>';
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
    var approveResearchButton = new CanvasButton({
        label: 'Choose Research',
        centerX: 720,
        centerY: 750,
        width: 200,
        height: 70,
        clickCallback: function() {
            that.approveResearch();
        }
    });
    this.uiButtons.push(approveResearchButton);
    this.researchUI.push(approveResearchButton);

    Game.BackgroundMusic.playSingular(true);

    // research toggle button
    this.uiButtons.push(new CanvasButton({
        label: '',
        centerX: 1457,
        centerY: 1013,
        width: 70,
        height: 70,
        clickCallback: function() {
            that.showResearchUI(that.state === Game.State.PLAYING);
        },
        renderFunc: function(ctx, cursorOn, buttonDown, button) {
            var glowAmount = that.researchGlowAmount;
            if (glowAmount > 0) {
                ctx.globalAlpha = glowAmount;
                that.blueGlowSprite.drawRotated(ctx, button.visualX(), button.visualY());
            }
        }
    }));
    
    // next turn button
    this.uiButtons.push(new CanvasButton({
        label: '',
        centerX: 1838,
        centerY: 968,
        width: 70,
        height: 70,
        clickCallback: function() {
            if (that.state === Game.State.PLAYING) {
                that.nextPhase();
            }
        },
        renderFunc: function(ctx, cursorOn, buttonDown, button) {
            var glowAmount = that.nextPhaseGlowAmount();
            if (glowAmount > 0) {
                ctx.globalAlpha = glowAmount;
                that.redGlowSprite.drawRotated(ctx, button.visualX(), button.visualY());
            }
        }
    }));
    
    var replayButton = new CanvasButton({
        label: 'Replay last turn',
        centerX: 130,
        centerY: 720,
        width: 200,
        height: 70,
        clickCallback: function() {
            if (that.state === Game.State.PLAYING) {
                that.resetAnimations();
            }
        }
    });
    this.uiButtons.push(replayButton);
    this.playingUI.push(replayButton);
    
    var fsButton = new CanvasButton({
        label: 'Go Fullscreen',
        centerX: 1920 * 0.5,
        centerY: 800,
        width: 200,
        height: 70,
        clickCallback: function() {
            requestFullscreen(document.body);
        }
    });
    this.uiButtons.push(fsButton);
    this.preTurnUI.push(fsButton);
    var startTurnButton = new CanvasButton({
        label: 'Start Turn',
        centerX: 1920 * 0.5,
        centerY: 540,
        width: 250,
        height: 100,
        clickCallback: function() {
            that.nextPhase();
        }
    });
    this.uiButtons.push(startTurnButton);
    this.preTurnUI.push(startTurnButton);
    var aiTurnButton = new CanvasButton({
        label: 'Let AI Play This Turn',
        centerX: 1920 * 0.5,
        centerY: 670,
        width: 250,
        height: 70,
        clickCallback: function() {
            that.aiTurn();
        }
    });
    this.uiButtons.push(aiTurnButton);
    this.preTurnUI.push(aiTurnButton);

    var addLocationUI = function(location) {
        var button = new CanvasButton({
            label: location.name,
            centerX: location.x,
            centerY: location.y,
            width: 65,
            height: 65,
            dragTargetFunc: function() {
                that.dragToLocation(location);
            },
            renderFunc: function(ctx, cursorOn, buttonDown, button) {
                location.render(ctx, cursorOn, buttonDown, button);
            },
            clickCallback: function() {
                that.sidebar.setUnit(location.getVisibleUnit());
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
                    width: 65,
                    height: 65,
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
        x = 50;
        var perRow = 9;
        for (var i = 0; i < Unit.Types.length; ++i) {
            var button = (function(j) {
                return new CanvasButton({
                    label: 'reserve ' + j,
                    centerX: x + (j % perRow) * 73,
                    centerY: y + Math.floor(j / perRow) *80 + ((j % perRow) % 2) * 34 - 15,
                    width: 65,
                    height: 65,
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
            that.reserveUI.push(button);
            faction.addUI(button);
        }
    };
    for (var i = 0; i < this.factions.length; ++i) {
        addFactionUI(this.factions[i]);
    }

    this.setUIActive(this.researchUI, false);
    this.setUIActive(this.playingUI, false);
};

Game.LocationParameters = [
{
    name: 'Britain',
    unit: new Unit(Unit.Types[0]),
    x: 325,
    y: 260,
    side: Side.Sides[1],
    terrain: ['wet'],
    steps: 4,
},
{
    name: 'Germany',
    unit: new Unit(Unit.Types[0]),
    x: 520,
    y: 395,
    side: Side.Sides[0],
    terrain: ['wet'],
    steps: 4,
},
{
    name: 'Russia',
    unit: new Unit(Unit.Types[0]),
    x: 1095,
    y: 100,
    side: Side.Sides[1],
    terrain: ['cold'],
    steps: 6,
},
{
    name: 'Baltics',
    unit: new Unit(Unit.Types[0]),
    x: 860,
    y: 210,
    side: Side.Sides[0],
    terrain: ['cold'],
    steps: 6,
},
{
    name: 'Greece',
    unit: new Unit(Unit.Types[0]),
    x: 1095,
    y: 580,
    side: Side.Sides[1],
    terrain: ['warm'],
    steps: 5
},
{
    name: 'Italy',
    unit: new Unit(Unit.Types[0]),
    x: 855,
    y: 505,
    side: Side.Sides[0],
    terrain: ['warm'],
    steps: 5
}
];

Game.prototype.drawFader = function(fade) {
    if (fade > 0) {
        this.ctx.globalAlpha = fade;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
};

Game.prototype.render = function() {
    this.bgSprite.fillCanvas(this.ctx);
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].render(this.ctx);
    }

    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].render(this.ctx);
    }
    
    this.drawFader(this.researchFade);

    this.ctx.globalAlpha = 1.0;
    this.infoPanelsSprite.fillCanvas(this.ctx);
    
    this.sidebar.render();
    this.researchHTML.style.transform = 'scale(' + resizer.getScale() + ')';
    
    this.ctx.globalAlpha = 1.0;
    this.turnPanelSprite.draw(this.ctx, this.ctx.canvas.width - this.turnPanelSprite.width, this.ctx.canvas.height - this.turnPanelSprite.height);
    
    this.drawFader(this.preturnFade);

    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].render(this.ctx, this.cursorX, this.cursorY);
    }
    var side = Side.Sides[this.currentTurnSide];
    if (this.state === Game.State.PRE_TURN) {
        this.ctx.globalAlpha = 1.0;
        var header = side.name + ' player, get ready for turn #' + this.turnNumber + '.';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = side.color;
        this.ctx.font = '30px special_eliteregular';
        this.ctx.fillText(header, this.ctx.canvas.width * 0.5, 450);
    }
    return this.ctx;
};

Game.prototype.showResearchUI = function(show) {
    if (show) {
        if (this.potentialResearch.length > 0) {
            this.state = Game.State.RESEARCH_PROPOSALS;
            this.researchHTML.style.display = 'block';
            for (var i = 0; i < 3; ++i) {
                var res = null;
                if (i < this.potentialResearch.length) {
                    res = this.potentialResearch[i];
                }
                this.researchProposals[i].setUnit(res);
                var hilight = this.researchProposals[i] === this.chosenResearch;
                this.researchProposals[i].hilight(hilight);
            }
            this.setUIActive(this.playingUI, false);
            this.setUIActive(this.researchUI, true);
            setPropertyInAll(this.reserveUI, 'draggable', false);
        }
    } else {
        this.state = Game.State.PLAYING;
        this.researchHTML.style.display = 'none';
        this.setUIActive(this.researchUI, false);
        this.setUIActive(this.playingUI, true);
        setPropertyInAll(this.reserveUI, 'draggable', true);
    }
}

Game.prototype.approveResearch = function() {
    if (this.chosenResearch !== null) {    
        this.factions[this.currentTurnSide].startResearch(this.chosenResearch);
        this.potentialResearch = [];
        this.showResearchUI(false);
    }
};

Game.prototype.aiTurn = function() {
    this.nextPhase();
    var currentFaction = this.factions[this.currentTurnSide];
    
    currentFaction.update(undefined, this.state); // Make animations complete instantly.
    this.setPotentialResearch();
    
    if (this.potentialResearch.length > 0) {
        this.chosenResearch = this.potentialResearch[0];
        this.approveResearch();
    }
    var moveRounds = Math.min(currentFaction.reserve.length, 3);
    var i = 0;
    while (currentFaction.reserve.length > 0 && i < moveRounds) {
        // Choose the most valuable unit from the sorted reserve
        var goodUnit = currentFaction.reserve[currentFaction.reserve.length - 1];

        // Find a location where the unit could be placed
        var locIndex = Math.floor(Math.random() * this.locations.length);
        var triesLeft = this.locations.length + 1;
        while (triesLeft > 0) {
            ++locIndex;
            if (locIndex >= this.locations.length) {
                locIndex = 0;
            }
            --triesLeft;
            if (this.locations[locIndex].side !== Side.Sides[this.currentTurnSide]) {
                continue;
            }
            if (this.locations[locIndex].unit.tier < goodUnit.tier) {
                // Good idea to place the unit here.
                break;
            }
        }
        if (triesLeft > 0) {
            this.fromReserveToLocation(goodUnit, this.locations[locIndex]);
        }
        ++i;
    }
    this.nextPhase();
};

Game.prototype.resetAnimations = function() {
    for (var i = 0; i < this.locations.length; ++i) {
        this.locations[i].resetAnimation();
    }
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].resetAnimation();
    }
};

Game.prototype.nextPhase = function() {
    if (this.state == Game.State.PRE_TURN) {
        // Out from pre-turn UI
        this.setUIActive(this.preTurnUI, false);
        
        // Get into the playing UI
        var currentFaction = this.factions[this.currentTurnSide];
        currentFaction.showUI(true);
        for (var i = 0; i < this.connections.length; ++i) {
            this.connections[i].setCurrentSide(Side.Sides[this.currentTurnSide]);
        }
        this.resetAnimations();

        // Set research options for this turn
        this.chosenResearch = null;
        this.potentialResearch = [];
        this.state = Game.State.PLAYING;
        this.setUIActive(this.playingUI, true);
    } else if (this.state == Game.State.PLAYING) {
        if (this.potentialResearch.length == 0) {
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
    }
};

Game.prototype.setUIActive = function(uiGroup, active) {
    for (var i = 0; i < uiGroup.length; ++i) {
        uiGroup[i].active = active;
    }
};

Game.prototype.getFaction = function(side) {
    for (var i = 0; i < this.factions.length; ++i) {
        if (this.factions[i].side === side) {
            return this.factions[i];
        }
    }
    return null;
};

Game.prototype.resolveTurn = function() {
    ++this.turnNumber;

    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].resolveCombat();
    }
    for (var i = 0; i < this.locations.length; ++i) {
        // Assign conventional army to locations where single-use units were used.
        if (this.locations[i].unit.singleUse) {
            var faction = this.getFaction(this.locations[i].side);
            var unit = faction.getCheapestReserveUnit();
            faction.removeReserve(unit);
            this.locations[i].unit = unit;
        }
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

    var animationInProgress = false;
    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].update(deltaTime);
    }
    animationInProgress = this.factions[this.currentTurnSide].update(deltaTime, this.state);
    this.setPotentialResearch();
    for (var i = 0; i < this.connections.length; ++i) {
        if (!animationInProgress) {
            animationInProgress = this.connections[i].update(deltaTime, this.state);
        }
    }
    
    if (this.state === Game.State.PRE_TURN) {
        this.preturnFade += deltaTime * 3;
    } else {
        this.preturnFade -= deltaTime * 3;
    }
    this.preturnFade = mathUtil.clamp(0, 1, this.preturnFade);

    if (this.state === Game.State.RESEARCH_PROPOSALS) {
        this.researchFade += deltaTime * 3;
    } else {
        this.researchFade -= deltaTime * 3;
    }
    this.researchFade = mathUtil.clamp(0, 1, this.researchFade);

    if (this.potentialResearch.length > 0) {
        if (this.state === Game.State.PLAYING) {
            this.researchGlowAmount += deltaTime * 10 * Math.sin(this.time * 20.0);
        } else if (this.state === Game.State.RESEARCH_PROPOSALS) {
            this.researchGlowAmount += deltaTime * 3;
        }
    } else {
        this.researchGlowAmount -= deltaTime * 3;
    }
    this.researchGlowAmount = mathUtil.clamp(0, 1, this.researchGlowAmount);
};

Game.prototype.setPotentialResearch = function() {
    var currentFaction = this.factions[this.currentTurnSide];
    if (currentFaction.researchSlotAvailable() && this.potentialResearch.length === 0) {
        this.potentialResearch = currentFaction.getPotentialResearch();
    }
};

Game.prototype.nextPhaseGlowAmount = function() {
    if (this.potentialResearch.length > 0 || this.state !== Game.State.PLAYING) {
        return 0;
    } else {
        return Math.sin(this.time * 2) * 0.5 + 0.3;
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
        this.fromReserveToLocation(this.downButton.draggedObject(), location);
    }
};

Game.prototype.fromReserveToLocation = function(reserveUnit, location) {
    this.factions[this.currentTurnSide].addToReserve(location.unit);
    this.factions[this.currentTurnSide].removeReserve(reserveUnit);
    location.unit = reserveUnit;
};

Game.prototype.click = function(vec) {
    for (var i = 0; i < this.uiButtons.length; ++i) {
        if (this.uiButtons[i].active && this.uiButtons[i].hitTest(this.cursorX, this.cursorY)) {
            this.downButton = this.uiButtons[i];
            if (this.uiButtons[i].draggable) {
                this.downButton.dragged = true;
                this.dragStartX = this.cursorX;
                this.dragStartY = this.cursorY;
            } else {
                this.uiButtons[i].click();
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
