var fs = Npm.require("fs");

var text = fs.readFileSync("/home/chaua/SeniorPro/src/wordbike/server/resources/words.txt", "utf8");
var wordList = text.split("\n");

var dictionary = {};

for(var i = 0; i < wordList.length; i++)
	dictionary[wordList[i]] = true;
