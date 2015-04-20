'use strict';

function filter(resultArray, arrayToRemove) {
    var cellRemoved = false;

    for ( var i = 0; i < resultArray.length; ) {
        cellRemoved = false;

        for ( var j = 0; j < arrayToRemove.length; j++ ) {
            if ( resultArray[i] == arrayToRemove[j] ) {
                resultArray.splice(i, 1);
                cellRemoved = true;
            }
        }

        if ( cellRemoved == false ) {
          i++;
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

function setPropertyInAll(array, key, value) {
    for (var i = 0; i < array.length; ++i) {
        array[i][key] = value;
    }
}

function requestFullscreen(elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
