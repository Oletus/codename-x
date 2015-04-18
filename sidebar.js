'use strict';

var UnitField = function(options) {
    var defaults = {
        property: 'name',
        x: 0,
        y: 0,
        align: 'left'
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

var SideBar = function(game, canvas) {
    this.height = 800;
    this.width = 450;

    this.game = game;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.unit = null;

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
    this.uiElems = [];
    this.unitprops = [];
    this.unitprops.push(new UnitField({'property':'codename',     'x':10,         'y':  0,  'align':'left'}));
    this.unitprops.push(new UnitField({'property':'description',  'x':10,         'y':100,  'align':'left'}));
    var sbthis = this;
};

SideBar.prototype.render = function() {
    this.ctx.fillStyle = '#000';
    var guiLeft = this.ctx.canvas.width-this.width;
    var guiTop = 0;

    this.ctx.fillRect(guiLeft, guiTop, this.width, this.height);

    for (var i = 0; i < this.uiElems.length; ++i) {
        this.uiElems[i].render(this.ctx, this.cursorX, this.cursorY);
    }

    this.renderUnitStats(guiLeft, guiTop)
    return this.ctx;
};

SideBar.prototype.renderUnitStats = function(guiLeft, guiTop) {
    if (this.unit === null) {return;}
    this.ctx.fillStyle = '#060';
    for (var i = 0; i < this.unitprops.length; ++i) {
        var field = this.unitprops[i];
        var text = this.unit[field.property];
        this.ctx.textAlign = field.align;
        this.ctx.fillText(text, guiLeft+field.x, guiTop+field.y+20, this.width-20);
    }
}

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
    for (var i = 0; i < this.uiElems.length; ++i) {
        if (this.uiElems[i].hitTest(this.cursorX, this.cursorY)) {
            this.uiElems[i].click();
        }
    }
};
