'use strict';

var CanvasButton = function(options) {
    var defaults = {
        label: 'Button',
        centerX: 0,
        centerY: 0,
        width: 100,
        height: 50,
        clickCallback: null,
        renderFunc: null,
        lastClick: Date.now() - 1000,
        active: true
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
    if (!this.active) {
        return;
    }
    var drawAsDown = this.isDown();
    var cursorOn = this.hitTest(cursorX, cursorY);

    if (this.renderFunc !== null) {
        this.renderFunc(ctx, cursorOn, drawAsDown, this);
        return;
    }

    var rect = this.getRect();
    ctx.fillStyle = '#000';
    if (cursorOn && !drawAsDown) {
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

CanvasButton.prototype.isDown = function() {
    var sinceClicked = Date.now() - this.lastClick;
    return sinceClicked < 500;
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
    if (this.isDown()) {
        return;
    }
    this.lastClick = Date.now();
    if (this.clickCallback !== null) {
        this.clickCallback();
    }
};
