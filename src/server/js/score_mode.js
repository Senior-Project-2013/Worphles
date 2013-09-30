var distribution = require("letter_distribution.js");

exports.getWordScore = function(letters) {
	var wordScore = 0;

	for(var i = 0; i < letters.length; i++)
		wordScore += distribution.letterInfo[letters[i]].score;

	return wordScore;
}