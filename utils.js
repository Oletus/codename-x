'use strict';

var arrayUtil = {}; // Utilities for working with JS arrays
var stringUtil = {}; // Utilities for working with JS strings

/**
 * Filter an array by removing elements that are found in the other array.
 * @param {Array} array Array to filter.
 * @param {Array} arrayToRemove Values to remove from the first array.
 * @return {Array} A new array with the filtered elements.
 */
arrayUtil.filterArray = function(array, arrayToRemove) {
    return array.filter(function(value) {
        return arrayToRemove.indexOf(value) < 0;
    });
};

/**
 * @param {Array} array Array to shuffle.
 * @return {Array} A shuffled copy of the array.
 */
arrayUtil.shuffle = function(array) {
    array = array.slice(0);
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};

/**
 * @param {Array} array Array to shuffle.
 * @param {number} maxSubsetLength Maximum subset to return.
 * @return {Array} A random subset of the array containing at most maxSubsetLength elements.
 */
arrayUtil.randomSubset = function(array, maxSubsetLength) {
    var shuffled = arrayUtil.shuffle(array);
    return shuffled.splice(0, maxSubsetLength);
};

/**
 * Set a property in all elements in an array to a certain value.
 * @param {Array} array Array to edit.
 * @param {string} key Property to set in all elements.
 * @param {Object} value A value to set to the property in all elements.
 */
arrayUtil.setPropertyInAll = function(array, key, value) {
    for (var i = 0; i < array.length; ++i) {
        array[i][key] = value;
    }
};



/**
 * @param {string} string Input string.
 * @return {string} String with the first letter capitalized.
 */
stringUtil.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};



/**
 * Request fullscreen on a given element.
 */
var requestFullscreen = function(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
};
