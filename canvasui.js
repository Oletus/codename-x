'use strict';

var CanvasLabel = function(options) {
    var defaults = {
        label: 'Label',
        labelFunc: null,
        centerX: 0,
        centerY: 0,
        active: true,
        fontSize: 30
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
};

CanvasLabel.prototype.render = function(ctx) {
    if (this.active) {
        ctx.globalAlpha = 1.0;
        ctx.color = '#fff';
        ctx.textAlign = 'center';
        ctx.font = this.fontSize + 'px special_eliteregular';
        var label = this.label;
        if (this.labelFunc) {
            label = this.labelFunc();
        }
        ctx.fillText(label, this.centerX, this.centerY);
    }
};

CanvasLabel.prototype.update = function(deltaTime) {
};

CanvasLabel.prototype.hitTest = function() {
    return false;
};

var CanvasButton = function(options) {
    var defaults = {
        label: 'Button',
        labelFunc: null,
        centerX: 0,
        centerY: 0,
        width: 100,
        height: 50,
        clickCallback: null,
        renderFunc: null,
        dragTargetFunc: null,
        draggedObject: null,
        active: true,
        draggable: false
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.draggedX = this.centerX;
    this.draggedY = this.centerY;
    this.dragged = false;
    this.time = 0.5;
    this.lastClick = 0;
};

CanvasButton.prototype.update = function(deltaTime) {
    this.time += deltaTime;
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
    ctx.font = '20px special_eliteregular';
    var label = this.label;
    if (this.labelFunc) {
        label = this.labelFunc();
    }
    ctx.fillText(label, this.centerX, this.centerY + 7);
};

CanvasButton.prototype.visualX = function() {
    if (this.dragged) {
        return this.draggedX;
    } else {
        return this.centerX;
    }
};

CanvasButton.prototype.visualY = function() {
    if (this.dragged) {
        return this.draggedY;
    } else {
        return this.centerY;
    }
};

CanvasButton.prototype.hitTest = function(x, y) {
    return this.getRect().mightIntersectCircleRoundedOut(x, y, 1);
};

CanvasButton.prototype.isDown = function() {
    var sinceClicked = this.time - this.lastClick;
    return sinceClicked < 0.5;
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
    this.lastClick = this.time;
    if (this.clickCallback !== null) {
        this.clickCallback();
    }
};
