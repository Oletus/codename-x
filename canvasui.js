'use strict';

var CanvasButton = function(options) {
    var defaults = {
        label: 'Button',
        centerX: 0,
        centerY: 0,
        width: 100,
        height: 50,
        clickCallback: null,
        lastClick: Date.now() - 1000
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

CanvasButton.prototype.render = function(ctx, cursorX, cursorY) {
    var sinceClicked = Date.now() - this.lastClick;
    var drawAsDown = sinceClicked < 1000;
    var rect = this.getRect();
    ctx.fillStyle = '#000';
    if (this.hitTest(cursorX, cursorY) && !drawAsDown) {
        ctx.globalAlpha = 1.0;
    } else {
        ctx.globalAlpha = 0.5;
    }
    ctx.fillRect(rect.left, rect.top, rect.width(), rect.height());
    if (!drawAsDown) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(rect.left, rect.top, rect.width(), rect.height());
    }
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(this.label, this.centerX, this.centerY + 7);
};

CanvasButton.prototype.hitTest = function(x, y) {
    return this.getRect().mightIntersectCircleRoundedOut(x, y, 1);
};

CanvasButton.prototype.getRect = function() {
    return new Rect(
        this.centerX - this.width * 0.5,
        this.centerX + this.width * 0.5,
        this.centerY - this.height * 0.5,
        this.centerY + this.height * 0.5
    );
};

CanvasButton.prototype.click = function() {
    this.lastClick = Date.now();
    if (this.clickCallback !== null) {
        this.clickCallback();
    }
};
