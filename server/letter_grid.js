var letterGenerator = require(__dirname+"/letter_generator.js");
var letterGrid = [];

exports.fillGrid = function(gridSize) {
	numLetters = gridSize * gridSize * 6; //6 - number of sides on cube

	for(var i = 0; i < numLetters; i++)
		letterGrid[i] = letterGenerator.getLetter();
};

exports.getGrid = function() {
  return letterGrid;
};
