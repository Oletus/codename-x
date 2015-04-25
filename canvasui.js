'use strict';

var CanvasUIElement = function(options) {
    var defaults = {
        label: 'Button',
        labelFunc: null,
        renderFunc: null,
        centerX: 0,
        centerY: 0,
        width: 100,
        height: 50,
        clickCallback: null,
        dragTargetCallback: null, // Called when something is dragged onto this object, with the dragged object as parameter.
        draggedObjectFunc: null,
        active: true,
        draggable: false,
        fontSize: 20,
        appearance: undefined // One of CanvasUIElement.Appearance. By default the appearance is determined based on callbacks.
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
    if (this.appearance === undefined) {
        if (this.clickCallback !== null) {
            this.appearance = CanvasUIElement.Appearance.BUTTON;
        } else {
            this.appearance = CanvasUIElement.Appearance.LABEL;
        }
    }
};

CanvasUIElement.Appearance = {
    BUTTON: 0,
    LABEL: 1
};

CanvasUIElement.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};

CanvasUIElement.prototype.render = function(ctx, cursorX, cursorY) {
    if (!this.active) {
        return;
    }
    var drawAsDown = this.isDown();
    var cursorOn = this.hitTest(cursorX, cursorY);

    if (this.renderFunc !== null) {
        this.renderFunc(ctx, cursorOn, drawAsDown, this);
        return;
    }

    if (this.appearance === CanvasUIElement.Appearance.BUTTON) {
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
    }
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = this.fontSize + 'px special_eliteregular';
    var label = this.label;
    if (this.labelFunc) {
        label = this.labelFunc();
    }
    ctx.fillText(label, this.centerX, this.centerY + 7);
};

CanvasUIElement.prototype.visualX = function() {
    if (this.dragged) {
        return this.draggedX;
    } else {
        return this.centerX;
    }
};

CanvasUIElement.prototype.visualY = function() {
    if (this.dragged) {
        return this.draggedY;
    } else {
        return this.centerY;
    }
};

CanvasUIElement.prototype.hitTest = function(x, y) {
    if (this.clickCallback !== null) {
        return this.getRect().mightIntersectCircleRoundedOut(x, y, 1);
    }
    return false;
};

CanvasUIElement.prototype.isDown = function() {
    var sinceClicked = this.time - this.lastClick;
    return sinceClicked < 0.5;
};

CanvasUIElement.prototype.getRect = function() {
    return new Rect(
        this.centerX - this.width * 0.5,
        this.centerX + this.width * 0.5,
        this.centerY - this.height * 0.5,
        this.centerY + this.height * 0.5
    );
};

CanvasUIElement.prototype.click = function() {
    if (this.isDown()) {
        return;
    }
    this.lastClick = this.time;
    if (this.clickCallback !== null) {
        this.clickCallback();
    }
};
