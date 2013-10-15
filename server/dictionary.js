var fs = require('fs');

var text = fs.readFileSync(__dirname+'/words.txt', "utf-8");
var wordList = text.split("\n");

var dictionary = {};

for(var i = 0; i < wordList.length; i++)
  dictionary[wordList[i]] = true;

exports.isAWord = function (word) {
  return word.length > 2 && dictionary[word];
}
