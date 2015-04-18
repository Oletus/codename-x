'use strict';

/**
 * An object for storing animations.
 * @param {Object} animationData Data for animation frames. Keys are animation ids. 
 * Values are arrays containing objects specifying frames.
 * Each frame has two mandatory keys: 'src' for frame source and 'duration' for a duration in milliseconds.
 * Duration can be set to 0 to have the frame run into infinity.
 * Example:
 * {
 *  idle: [{src: 'idle.png', duration: 0}],
 *  walk: [{src: 'walk1.png', duration: 50}, {src: 'walk2.png', duration: 50}]
 * }
 * @param {Object} options Object with the following optional keys:
 *  frameConstructor: function Constructor for single frames that takes the
 *      frame source as a parameter. Defaults to AnimatedSprite.frameConstructor.
 *  durationMultiplier: number Multiplier for specified frame durations. Useful if you
 *      want to have frame times relative to fixed FPS, for example. Defaults to 1.
 *  defaultDuration: number Default duration for a single frame. Defaults to 1.
 */
var AnimatedSprite = function(animationData, options) {
    var defaults = {
        frameConstructor: AnimatedSprite.frameConstructor,
        durationMultiplier: 1,
        defaultDuration: 1
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    // Construct animations by generating animation frames based on the sources.
    this.animations = {};
    this.defaultAnimation = undefined;
    for (var key in animationData) {
        if (animationData.hasOwnProperty(key)) {
            var animation = [];
            var singleAnimationData = animationData[key];
            for (var i = 0; i < singleAnimationData.length; ++i) {
                var frame = AnimatedSprite._getFrame(singleAnimationData[i].src, this.frameConstructor);
                var duration = this.defaultDuration;
                if (singleAnimationData[i].duration !== undefined)
                {
                    duration = singleAnimationData[i].duration
                }
                duration *= this.durationMultiplier;
                animation.push({frame: frame, duration: duration});
            }
            this.animations[key] = animation;
            if (this.defaultAnimation === undefined) {
                this.defaultAnimation = key;
            }
        }
    }
};

/**
 * Default constructor for single frames. Set this before loading any animations.
 */
AnimatedSprite.frameConstructor = null;
if ('Sprite' in window) {
    AnimatedSprite.frameConstructor = Sprite;
}

AnimatedSprite._getFrame = (function() {
    var frameCaches = [];

    return (function(src, frameConstructor) {
        var cachedFrames;
        for (var j = 0; j < frameCaches.length; ++j) {
            if (frameCaches[j].frameConstructor === frameConstructor) {
                cachedFrames = frameCaches[j].cachedFrames;
                break;
            }
        }
        if (cachedFrames === undefined) {
            cachedFrames = {};
            frameCaches.push({frameConstructor: frameConstructor, cachedFrames: cachedFrames});
        }
        if (!cachedFrames.hasOwnProperty('_' + src)) {
            var frame = new frameConstructor(src);
            cachedFrames['_' + src] = frame;
        }
        return cachedFrames['_' + src];
    });
})();

/**
 * An object that stores the current state of an animated sprite.
 * @param {AnimatedSprite} animatedSprite The animated sprite to use.
 * @param {function=} finishedFrameCallback A callback to execute when an animation has finished. Can be used to
 * switch to a different animation, for example. Takes the finished animation key as a parameter.
 */
var AnimatedSpriteInstance = function(animatedSprite, finishedAnimationCallback) {
    this.animatedSprite = animatedSprite;
    this.finishedAnimationCallback = finishedAnimationCallback;
    this.setAnimation(this.animatedSprite.defaultAnimation);
    var frame = this.animatedSprite.animations[this.animationKey][this.frame].frame;

    // Add draw functions dynamically - this is a bit inefficient, but makes this class very generic.
    var that = this;
    for (var key in frame) {
        if ((typeof(frame[key]) === 'function') && key.substr(0, 4) === 'draw') {
            (function(drawFuncName) {
                that[drawFuncName] = function() {
                    var frame = that.getCurrentFrame();
                    frame[drawFuncName].apply(frame, arguments);
                }
            })(key);
        }
    }
};

/**
 * Start playing an animation.
 * @param {string} animationKey The animation id in the AnimatedSprite.
 */
AnimatedSpriteInstance.prototype.setAnimation = function(animationKey) {
    this.animationKey = animationKey;
    this.frame = 0;
    this.framePos = 0;
};

AnimatedSpriteInstance.prototype.update = function(deltaTime) {
    var currentAnimation = this.animatedSprite.animations[this.animationKey];
    if (currentAnimation[this.frame].duration > 0) {
        this.framePos += deltaTime * 1000;
        while (this.framePos > currentAnimation[this.frame].duration) {
            this.framePos -= currentAnimation[this.frame].duration;
            ++this.frame;
            if (this.frame >= currentAnimation.length) {
                this.frame = 0;
                if (this.finishedAnimationCallback !== undefined) {
                    this.finishedAnimationCallback(this.animationKey);
                }
            }
        }
    }
};

/**
 * @return {string} The current animation key.
 */
AnimatedSpriteInstance.prototype.getCurrentAnimation = function() {
    return this.animationKey;
};

/**
 * @return {Object} The current frame of the animation.
 */
AnimatedSpriteInstance.prototype.getCurrentFrame = function() {
    return this.animatedSprite.animations[this.animationKey][this.frame].frame;
};
