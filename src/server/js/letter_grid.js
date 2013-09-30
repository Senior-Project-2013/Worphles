var letterGenerator = require("letter_generator.js");

exports.letterGrid = [];

exports.fillGrid = function(gridSize) {
	numLetters = gridSize * gridSize * 6; //6 - number of sides on cube

	for(var i = 0; i < numLetters; i++)
		exports.letterGrid[i] = letterGenerator.getLetter();
}

exports.replaceLetter = function(coordinate) {
	exports.letterGrid[coordinate] = letterGenerator.getLetter();
}