var fs = require('fs');

var text = fs.readFileSync(__dirname+'/words.txt', "utf-8");
var wordList = text.split("\r\n");

var dictionary = {};

for(var i = 0; i < wordList.length; i++)
  dictionary[wordList[i]] = true;

var letterDistribution = [
  {
    letter: "A",
    frequency: 0.0806425,
    score: 1
  },
  {
    letter: "B",
    frequency: 0.0960163,
    score: 3
  },
  {
    letter: "C",
    frequency: 0.1229086,
    score: 3
  },
  {
    letter: "D",
    frequency: 0.1661953,
    score: 2
  },
  {
    letter: "E",
    frequency: 0.2950576,
    score: 1
  },
  {
    letter: "F",
    frequency: 0.3195423,
    score: 4
  },
  {
    letter: "G",
    frequency: 0.3391679,
    score: 2
  },
  {
    letter: "H",
    frequency: 0.4001551,
    score: 4
  },
  {
    letter: "I",
    frequency: 0.4692106,
    score: 1
  },
  {
    letter: "J",
    frequency: 0.4703283,
    score: 8
  },
  {
    letter: "K",
    frequency: 0.4765805,
    score: 5
  },
  {
    letter: "L",
    frequency: 0.5175973,
    score: 1
  },
  {
    letter: "M",
    frequency: 0.5426070,
    score: 3
  },
  {
    letter: "N",
    frequency: 0.6124568,
    score: 1
  },
  {
    letter: "O",
    frequency: 0.6862399,
    score: 1
  },
  {
    letter: "P",
    frequency: 0.7032713,
    score: 3
  },
  {
    letter: "Q",
    frequency: 0.7043362,
    score: 10
  },
  {
    letter: "R",
    frequency: 0.7659019,
    score: 1
  },
  {
    letter: "S",
    frequency: 0.8297193,
    score: 1
  },
  {
    letter: "T",
    frequency: 0.9199659,
    score: 1
  },
  {
    letter: "U",
    frequency: 0.9478228,
    score: 1
  },
  {
    letter: "V",
    frequency: 0.9580807,
    score: 5
  },
  {
    letter: "W",
    frequency: 0.9792730,
    score: 4
  },
  {
    letter: "X",
    frequency: 0.9809672,
    score: 8
  },
  {
    letter: "Y",
    frequency: 0.9990304,
    score: 4
  },
  {
    letter: "Z",
    frequency: 1.0000000,
    score: 10
  }
];

exports.makeLetter = function() {
  var random = Math.random();
  for (i = 0; i < letterDistribution.length; i++) {
    if (random < letterDistribution[i].frequency) {
      return letterDistribution[i].letter;
    }
  }
  return null;
};

exports.isAWord = function (word) {
  return word.length > 2 && dictionary[word];
}

exports.getWordScore = function(letters) {
  var wordScore = 0;

  for(var i = 0; i < letters.length; i++) {
    wordScore += letterDistribution[letters[i]].score;
  }

  return wordScore;
}
