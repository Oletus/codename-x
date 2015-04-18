'use strict';

var SideBar = function(game, canvas) {
    this.height = 800;
    this.width = 450;
    this.active = false;

    this.game = game;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.createUI();

    var sbthis = this;
    this.canvas.addEventListener('mousemove', function(event) {
        sbthis.setCursorPosition(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('mousedown', function(event) {
        sbthis.click(resizer.getCanvasPosition(event));
    });
    this.canvas.addEventListener('touchstart', function(event) {
        sbthis.click(resizer.getCanvasPosition(event));
    });
    this.setCursorPosition({x: 0, y: 0});
};

SideBar.prototype.createUI = function() {
    this.uiButtons = [];

    var sbthis = this;
};

SideBar.prototype.render = function() {
    if (!this.active) {return;}
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.ctx.canvas.width-this.width, 0, this.width, this.height);

    for (var i = 0; i < this.uiButtons.length; ++i) {
        this.uiButtons[i].render(this.ctx, this.cursorX, this.cursorY);
    }
    //TODO: Get active side? var side = Side.Sides[this.currentTurnSide];
    return this.ctx;
};

SideBar.prototype.hitTest = function(x, y) {
    return false;
};

SideBar.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};

SideBar.prototype.setUnit = function(unit) {
    this.unit = unit;
}

SideBar.prototype.setCursorPosition = function(vec) {
    this.cursorX = vec.x;
    this.cursorY = vec.y;
};

SideBar.prototype.click = function(vec) {
    this.setCursorPosition(vec);
    for (var i = 0; i < this.uiButtons.length; ++i) {
        if (this.uiButtons[i].hitTest(this.cursorX, this.cursorY)) {
            this.uiButtons[i].click();
        }
    }
};
