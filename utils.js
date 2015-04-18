"use strict";

function filter(resultArray, arrayToRemove) {
    for ( var i = 0; i < resultArray.length; i++ ) {
        for ( var j = 0; j < arrayToRemove.length; j++ ) {
            if ( resultArray[i] == arrayToRemove[j] ) {
                resultArray.splice(i, 1);
            }
        }
    }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

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
}