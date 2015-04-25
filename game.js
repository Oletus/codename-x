'use strict';

 CanvasUI.defaultFont = 'special_eliteregular';

var Game = function(canvas) {
    this.bgSprite = new Sprite('background.jpg');
    this.infoPanelsSprite = new Sprite('info_panels.png');
    this.turnPanelSprite = new Sprite('turn_panel.png');
    this.redGlowSprite = new Sprite('red_glow.png');
    this.yellowGlowSprite = new Sprite('red_glow.png', '#ff8');
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    
    this.sidebar = new SideBar();

    this.canvasUI = new CanvasUI({
        element: this.canvas,
        getCanvasPositionFromEvent: function(event) {
            return resizer.getCanvasPosition(event);
        }
    });

    this.restartGame();
};

Game.prototype.restartGame = function() {
    this.isGameOver = false;
    this.locations = [];
    this.connections = [];
    this.factions = [];
    this.time = 0;
    for (var i = 0; i < FactionData.length; ++i) {
        this.factions.push(new Faction(FactionData[i]));
        for (var j = 0; j < this.factions[i].locations.length; ++j) {
            this.locations.push(this.factions[i].locations[j]);
        }
    }
    for (var i = 0; i < this.locations.length / 2; ++i) {
        var steps = this.locations[i].steps + this.locations[i + 3].steps;
        var a = this.locations[i];
        var b = this.locations[i + 3];
        this.connections.push(new Connection({locationA: a, locationB: b, steps: steps}));
    }
    
    this.turnNumber = 0; // How many turns have passed (for both players)
    this.preturnFade = 1;
    this.researchFade = 0;
    this.finishedAnimation = 0;
    this.currentTurnIndex = 0; // Index to this.factions
    this.currentFaction = this.factions[this.currentTurnIndex];
    this.state = Game.State.PRE_TURN;
    this.playingAgainstAI = false;
    
    this.potentialResearch = [];
    this.chosenResearch = null;
    this.researchGlowAmount = 0; // visual glow for the research button.

    this.createUI();
    this.sidebar.setUnit(null);

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
    this.canvasUI.clear();
    this.preTurnUI = []; // Contains those buttons that are only visible during the "PRE_TURN" stage.
    this.playingUI = []; // Contains those buttons that are only visible during the "PLAYING" stage.
    this.researchUI = []; // Contains those buttons that are only visible during the "RESEARCH_PROPOSALS" stage.
    this.victoryUI = []; // Contains those buttons that are only visible during the "FINISHED" stage.
    this.reserveUI = [];

    var that = this;
    
    this.researchHTML = document.createElement('div');
    this.researchHTML.id = 'researchWrap';
    this.researchHTML.style.display = 'none';
    canvasWrapper.appendChild(this.researchHTML);
    
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
    var approveResearchButton = new CanvasUIElement({
        labelFunc: function() {
            return 'Approve Research for Lab ' + (that.currentFaction.currentResearch.length + 1) + ' / ' + that.currentFaction.researchSlots;
        },
        centerX: 720,
        centerY: 750,
        width: 350,
        height: 70,
        clickCallback: function() {
            that.approveResearch();
        }
    });
    this.canvasUI.uiElements.push(approveResearchButton);
    this.researchUI.push(approveResearchButton);

    Game.BackgroundMusic.playSingular(true);

    // research toggle button
    this.canvasUI.uiElements.push(new CanvasUIElement({
        label: '',
        centerX: 1457,
        centerY: 1013,
        width: 70,
        height: 70,
        clickCallback: function() {
            that.showResearchUI(that.state === Game.State.PLAYING);
        },
        renderFunc: function(ctx, cursorOn, pressedExtent, button) {
            var glowAmount = that.researchGlowAmount;
            if (glowAmount > 0) {
                ctx.globalAlpha = glowAmount;
                that.yellowGlowSprite.drawRotated(ctx, button.visualX(), button.visualY());
            }
        }
    }));
    
    // next turn button
    this.canvasUI.uiElements.push(new CanvasUIElement({
        label: '',
        centerX: 1838,
        centerY: 968,
        width: 70,
        height: 70,
        clickCallback: function() {
            if (that.state === Game.State.PLAYING && !that.animationInProgress) {
                that.nextPhase();
            }
        },
        renderFunc: function(ctx, cursorOn, pressedExtent, button) {
            var glowAmount = that.nextPhaseGlowAmount();
            if (glowAmount > 0) {
                ctx.globalAlpha = glowAmount;
                that.redGlowSprite.drawRotated(ctx, button.visualX(), button.visualY());
            }
        }
    }));
    
    var replayButton = new CanvasUIElement({
        labelFunc: function() {
            if (that.animationInProgress) {
                return 'Skip combat animation';
            } else {
                return 'Replay last turn';
            }
        },
        centerX: 170,
        centerY: 720,
        width: 280,
        height: 70,
        clickCallback: function() {
            if (that.state === Game.State.PLAYING || that.state === Game.State.FINISHED) {
                if (that.animationInProgress) {
                    that.skipAnimations();
                } else {
                    that.resetAnimations();
                }
            }
        }
    });
    this.canvasUI.uiElements.push(replayButton);
    this.playingUI.push(replayButton);
    
    var resetGameButton = new CanvasUIElement({
        label: 'Restart game',
        centerX: 1270,
        centerY: 720,
        width: 280,
        height: 70,
        activeFunc: function() {
            return (that.state === Game.State.FINISHED);
        },
        clickCallback: function() {
            if (that.state === Game.State.FINISHED) {
                Game.VictoryMusic.stop();
                that.restartGame();
            }
        }
    });
    this.canvasUI.uiElements.push(resetGameButton);
    this.victoryUI.push(resetGameButton);
    
    var fsButton = new CanvasUIElement({
        label: 'Go Fullscreen',
        centerX: 1920 * 0.8,
        centerY: 800,
        width: 240,
        height: 70,
        clickCallback: function() {
            requestFullscreen(document.body);
        }
    });
    this.canvasUI.uiElements.push(fsButton);
    this.preTurnUI.push(fsButton);
    var muteButton = new CanvasUIElement({
        labelFunc: function() {
            return Audio.allMuted ? 'Unmute audio' : 'Mute audio';
        },
        centerX: 1920 * 0.2,
        centerY: 800,
        width: 240,
        height: 70,
        clickCallback: function() {
            Audio.muteAll(!Audio.allMuted);
        }
    });
    this.canvasUI.uiElements.push(muteButton);
    this.preTurnUI.push(muteButton);
    
    var nameLabel = new CanvasUIElement({
        label: 'Panjandrum vs. Triebflügel',
        centerX: 1920 * 0.5,
        centerY: 250,
        fontSize: 60
    });
    this.canvasUI.uiElements.push(nameLabel);
    this.preTurnUI.push(nameLabel);
    var creditsLabel = new CanvasUIElement({
        label: 'LUDUM DARE #32 JAM GAME',
        centerX: 1920 * 0.5,
        centerY: 960,
        fontSize: 20
    });
    this.canvasUI.uiElements.push(creditsLabel);
    this.preTurnUI.push(creditsLabel);
    var creditsLabel2 = new CanvasUIElement({
        label: 'By Olli Etuaho, Valtteri Heinonen, Charlie Hornsby, Sakari Leppä, Kimmo Keskinen, Anastasia Diatlova and Zachary Laster',
        centerX: 1920 * 0.5,
        centerY: 1000,
        fontSize: 20
    });
    this.canvasUI.uiElements.push(creditsLabel2);
    this.preTurnUI.push(creditsLabel2);
    
    var startTurnButton = new CanvasUIElement({
        label: 'Start Turn',
        centerX: 1920 * 0.5,
        centerY: 540,
        width: 350,
        height: 100,
        clickCallback: function() {
            that.nextPhase();
        }
    });
    this.canvasUI.uiElements.push(startTurnButton);
    this.preTurnUI.push(startTurnButton);
    this.aiPlayerButton = new CanvasUIElement({
        label: 'Let AI Control This Faction',
        centerX: 1920 * 0.5,
        centerY: 700,
        width: 350,
        height: 70,
        clickCallback: function() {
            if (!that.playingAgainstAI) {
                that.currentFaction.aiControlled = true;
                that.playingAgainstAI = true;
                that.aiTurn();
            }
        }
    });
    this.canvasUI.uiElements.push(this.aiPlayerButton);
    this.preTurnUI.push(this.aiPlayerButton);

    if (DEV_MODE) {
        var aiTurnButton = new CanvasUIElement({
            label: 'Let AI Play This Turn',
            centerX: 1920 * 0.5,
            centerY: 900,
            width: 350,
            height: 70,
            clickCallback: function() {
                that.aiTurn();
            }
        });
        this.canvasUI.uiElements.push(aiTurnButton);
        this.preTurnUI.push(aiTurnButton);
    }

    var addLocationUI = function(location) {
        var button = new CanvasUIElement({
            label: location.name,
            centerX: location.x,
            centerY: location.y,
            width: 90,
            height: 90,
            dragTargetCallback: function(draggedObject) {
                that.dragToLocation(draggedObject, location);
            },
            renderFunc: function(ctx, cursorOn, pressedExtent, button) {
                location.render(ctx, cursorOn, pressedExtent, button);
            },
            clickCallback: function() {
                that.sidebar.setUnit(location.getVisibleUnit());
            },
            draggable: true,
            draggedObjectFunc: function() {
                return location;
            }
        });
        that.canvasUI.uiElements.push(button);
        location.button = button;
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
                return new CanvasUIElement({
                    label: 'research ' + j,
                    centerX: x,
                    centerY: y + j * 80,
                    width: 75,
                    height: 75,
                    active: false,
                    renderFunc: function(ctx, cursorOn, pressedExtent, button) {
                        faction.renderResearchButton(ctx, cursorOn, pressedExtent, j, button);
                    },
                    clickCallback: function() {
                        if (j < faction.currentResearch.length) {
                            that.sidebar.setUnit(faction.currentResearch[j].unitType);
                        }
                    }
                });
            })(i);
            that.canvasUI.uiElements.push(button);
            faction.addUI(button);
        }
        x = 50;
        var perRow = 9;
        for (var i = 0; i < Unit.Types.length; ++i) {
            var button = (function(j) {
                return new CanvasUIElement({
                    label: 'reserve ' + j,
                    centerX: x + (j % perRow) * 73,
                    centerY: y + Math.floor(j / perRow) * 80 + ((j % perRow) % 2) * 34 - 15,
                    width: 73,
                    height: 73,
                    active: false,
                    draggable: true,
                    renderFunc: function(ctx, cursorOn, pressedExtent, button) {
                        faction.renderReserveButton(ctx, cursorOn, pressedExtent, j, button);
                    },
                    clickCallback: function() {
                        if (j < faction.reserve.length) {
                            that.sidebar.setUnit(faction.reserve[j]);
                        }
                    },
                    draggedObjectFunc: function() {
                        return faction.reserve[j];
                    }
                });
            })(i);
            that.canvasUI.uiElements.push(button);
            that.reserveUI.push(button);
            faction.addUI(button);
            button.reserveIndex = i; // TODO: clean up this hack...
        }
        // Intel buttons
        x = 780;
        for (var i = 0; i < faction.researchSlots; ++i) {
            var button = (function(j) {
                return new CanvasUIElement({
                    label: 'opponent research ' + j,
                    centerX: x,
                    centerY: y + j * 80,
                    width: 75,
                    height: 75,
                    active: false,
                    draggable: false,
                    renderFunc: function(ctx, cursorOn, pressedExtent, button) {
                        faction.renderIntelButton(ctx, cursorOn, pressedExtent, j, button);
                    },
                    clickCallback: function() {
                        if (j < faction.researchIntel.length) {
                            that.sidebar.setUnit(faction.researchIntel[j], 'The enemy is researching ');
                        }
                    }
                });
            })(i);
            that.canvasUI.uiElements.push(button);
            faction.addUI(button);
        }
        var intelLabel = new CanvasUIElement({
            centerX: 846,
            centerY: 882,
            labelFunc: function() {
                return faction.getCurrentIntelPower();
            },
            active: false,
            fontSize: 30
        });
        that.canvasUI.uiElements.push(intelLabel);
        faction.addUI(intelLabel);
    };
    for (var i = 0; i < this.factions.length; ++i) {
        addFactionUI(this.factions[i]);
    }

    this.setUIActive(this.researchUI, false);
    this.setUIActive(this.playingUI, false);
    this.setUIActive(this.victoryUI, false);
};

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

    var gameAreaFade = this.researchFade;
    if (this.finishedAnimation > 0) {
        gameAreaFade = Math.min(this.finishedAnimation, 0.2);
    }
    
    this.drawFader(gameAreaFade);

    this.ctx.globalAlpha = 1.0;
    this.infoPanelsSprite.fillCanvas(this.ctx);
    
    this.sidebar.render();
    this.researchHTML.style.transform = 'scale(' + resizer.getScale() + ')';
    
    this.ctx.globalAlpha = 1.0;
    this.turnPanelSprite.draw(this.ctx, this.ctx.canvas.width - this.turnPanelSprite.width, this.ctx.canvas.height - this.turnPanelSprite.height);
    
    this.drawFader(this.preturnFade);

    this.canvasUI.render(this.ctx);
    
    if (this.finishedAnimation > 0) {
        this.ctx.save();
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        this.ctx.globalAlpha = Math.min(this.finishedAnimation, 1);
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '40px special_eliteregular';
        this.ctx.fillText(stringUtil.capitalizeFirstLetter(this.winner.name + ' powers are victorious!'), 720, 730);
        this.ctx.restore();
    }

    if (this.state === Game.State.PRE_TURN) {
        this.ctx.globalAlpha = 1.0;
        var header = stringUtil.capitalizeFirstLetter(this.currentFaction.name + ' powers official, get ready for turn #' + this.turnNumber + '.');
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.currentFaction.color;
        this.ctx.font = '30px special_eliteregular';
        this.ctx.fillText(header, this.ctx.canvas.width * 0.5, 450);
    }
    return this.ctx;
};

Game.prototype.showResearchUI = function(show) {
    if (this.state >= Game.State.FINISHED) {
        return;
    }
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
            arrayUtil.setPropertyInAll(this.reserveUI, 'draggable', false);
        }
    } else {
        this.state = Game.State.PLAYING;
        this.researchHTML.style.display = 'none';
        this.setUIActive(this.researchUI, false);
        this.setUIActive(this.playingUI, true);
        arrayUtil.setPropertyInAll(this.reserveUI, 'draggable', true);
        for (var i = 0; i < this.reserveUI.length; ++i) {
            if (this.reserveUI[i].reserveIndex >= this.currentFaction.reserve.length) {
                this.reserveUI[i].draggable = false;
            }
        }
    }
}

Game.prototype.approveResearch = function() {
    if (this.chosenResearch !== null) {    
        this.currentFaction.startResearch(this.chosenResearch);
        this.potentialResearch = [];
        this.showResearchUI(false);
    }
};

Game.prototype.aiTurn = function() {
    this.nextPhase();
    
    this.currentFaction.update(undefined, this.state); // Make animations complete instantly.
    this.setPotentialResearch();
    
    if (this.potentialResearch.length > 0) {
        this.chosenResearch = this.potentialResearch[0];
        this.approveResearch();
    }
    // swappinessFactor is the tendency to shuffle around same tier units
    var swappinessFactor = Math.random() * 0.1 * (Math.min(this.turnNumber, 10) - 1);
    var moveRounds = Math.min(this.currentFaction.reserve.length, 3) + Math.floor(swappinessFactor * 2);
    var i = 0;
    while (this.currentFaction.reserve.length > 0 && i < moveRounds) {
        // Choose the most valuable unit from the sorted reserve
        var goodUnit = this.currentFaction.reserve[this.currentFaction.reserve.length - 1];

        // Find a location where the unit could be placed
        var locIndex = Math.floor(Math.random() * this.locations.length);
        var triesLeft = this.locations.length + 1;
        while (triesLeft > 0) {
            ++locIndex;
            if (locIndex >= this.locations.length) {
                locIndex = 0;
            }
            --triesLeft;
            if (this.locations[locIndex].faction !== this.currentFaction) {
                continue;
            }
            if (this.locations[locIndex].unit.tier < goodUnit.tier) {
                // Good idea to place the unit here.
                break;
            } else if (this.locations[locIndex].unit.tier == goodUnit.tier && Math.random() < swappinessFactor) {
                // Make the AI swap units on the same tier occasionally.
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
        this.locations[i].button.draggable = false;
    }
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].resetAnimation();
    }
};

Game.prototype.skipAnimations = function() {
    for (var i = 0; i < this.locations.length; ++i) {
        this.locations[i].skipAnimation();
    }
    for (var i = 0; i < this.connections.length; ++i) {
        this.connections[i].skipAnimation();
    }
};

Game.prototype.nextPhase = function() {
    if (this.state == Game.State.PRE_TURN) {
        // Out from pre-turn UI
        this.setUIActive(this.preTurnUI, false);
        
        // Get into the playing UI
        this.currentFaction = this.factions[this.currentTurnIndex];
        this.currentFaction.showUI(true);
        for (var i = 0; i < this.locations.length; ++i) {
            this.locations[i].setCurrentFaction(this.currentFaction);
        }
        this.resetAnimations();

        // Set research options for this turn
        this.chosenResearch = null;
        this.potentialResearch = [];
        this.state = Game.State.PLAYING;
        this.setUIActive(this.playingUI, true);
    } else if (this.state == Game.State.PLAYING) {
        if (this.potentialResearch.length == 0) {
            this.currentFaction.showUI(false);
            ++this.currentTurnIndex;
            if (this.currentTurnIndex === this.factions.length) {
                this.currentTurnIndex = 0;
                this.resolveTurn();
            }
            this.currentFaction = this.factions[this.currentTurnIndex];
            this.sidebar.setUnit(null);
            this.state = Game.State.PRE_TURN;
            this.setUIActive(this.playingUI, false);
            this.setUIActive(this.preTurnUI, true);
            if (this.turnNumber >= 2) {
                this.aiPlayerButton.active = false;
            }
            if (this.currentFaction.aiControlled) {
                this.aiTurn();
            } else if (this.playingAgainstAI) {
                this.nextPhase();
            }
        }
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
    for (var i = 0; i < this.locations.length; ++i) {
        // Assign conventional army to locations where single-use units were used.
        if (this.locations[i].unit.singleUse) {
            var faction = this.locations[i].faction;
            var unit = faction.getCheapestReserveUnit();
            faction.removeReserve(unit);
            this.locations[i].unit = unit;
        }
    }
    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].updateIntel(this.factions[1 - i]);
    }
    for (var i = 0; i < this.factions.length; ++i) {
        this.factions[i].advanceResearch();
    }
    this.setGameOver();
};

Game.prototype.setGameOver = function() {
    // Return true if the game is over
    var victories = [0, 0];
    for (var i = 0; i < this.connections.length; ++i) {
        if (this.connections[i].isBattleOver()) {
            if (this.connections[i].locationA.faction === this.factions[0]) {
                victories[0]++;
            } else {
                victories[1]++;
            }
        }
    }
    for (var i = 0; i < victories.length; ++i) {
        if (victories[i] >= 2) {
            this.isGameOver = true;
            this.winner = this.factions[i];
        }
    }
};

Game.prototype.update = function(deltaTime) {
    this.time += deltaTime;

    this.animationInProgress = false;
    this.canvasUI.update(deltaTime);
    this.animationInProgress = this.currentFaction.update(deltaTime, this.state);
    this.setPotentialResearch();
    for (var i = 0; i < this.connections.length; ++i) {
        if (!this.animationInProgress) {
            this.animationInProgress = this.connections[i].update(deltaTime, this.state);
        }
    }
    if (this.state === Game.State.PLAYING && !this.animationInProgress && this.isGameOver) {
        Game.BackgroundMusic.stop();
        Game.VictoryMusic.playSingular();
        this.state = Game.State.FINISHED;
        this.setUIActive(this.victoryUI, true);
    }
    if (this.state === Game.State.PLAYING && !this.animationInProgress && !this.isGameOver) {
        for (var i = 0; i < this.locations.length; ++i) {
            if (this.locations[i].faction === this.currentFaction) {
                this.locations[i].button.draggable = true;
            }
        }
        arrayUtil.setPropertyInAll(this.reserveUI, 'draggable', true);
        for (var i = 0; i < this.reserveUI.length; ++i) {
            if (this.reserveUI[i].reserveIndex >= this.currentFaction.reserve.length) {
                this.reserveUI[i].draggable = false;
            }
        }
    } else {
        arrayUtil.setPropertyInAll(this.reserveUI, 'draggable', false);
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
    
    if (this.state === Game.State.FINISHED) {
        this.finishedAnimation += deltaTime;
    }

    if (this.potentialResearch.length > 0 && !this.isGameOver && !this.animationInProgress) {
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
    if (this.currentFaction.researchSlotAvailable() && this.potentialResearch.length === 0) {
        this.potentialResearch = this.currentFaction.getPotentialResearch();
    }
};

Game.prototype.nextPhaseGlowAmount = function() {
    if (this.potentialResearch.length > 0 || this.state !== Game.State.PLAYING || this.animationInProgress) {
        return 0;
    } else {
        return Math.sin(this.time * 2) * 0.5 + 0.3;
    }
};

Game.prototype.dragToLocation = function(draggedObject, location) {
    if (location.faction === this.currentFaction) {
        if (draggedObject instanceof Location) {
            if (draggedObject.faction === location.faction) {
                this.fromLocationToLocation(draggedObject, location);
            }
        } else {
            this.fromReserveToLocation(draggedObject, location);
        }
    }
};

Game.prototype.fromReserveToLocation = function(reserveUnit, location) {
    this.currentFaction.addToReserve(location.unit);
    this.currentFaction.removeReserve(reserveUnit);
    location.unit = reserveUnit;
};

Game.prototype.fromLocationToLocation = function(locA, locB) {
    var temp = locA.unit;
    locA.unit = locB.unit;
    locB.unit = temp;
};
