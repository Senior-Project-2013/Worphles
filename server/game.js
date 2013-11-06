var dictionary = require('./dictionary');
var pathValidator = require('./path_validator.js');
var cubeGrid = require('./cube_grid').getGrid();
var _ = require('underscore');
var uuid = require('node-uuid');
var util = require('util');

// all time is in milliseconds
var MS_PER_SEC = 1000;
var MS_PER_MIN = MS_PER_SEC * 60;
var DEFAULTS = {
  ROUND_TIME: (180 * MS_PER_SEC),
  MAX_PLAYERS: 2,
  GRID_SIZE: 4,
  NAME: 'Worphles',
  PASSWORD: '',
  HACKABLE: false
};
var GAME_LENGTHS = [(60 * MS_PER_SEC), (180 * MS_PER_SEC), (300 * MS_PER_SEC)];
var GRID_SIZES = [4, 5, 6, 7, 8];
var MAX_PLAYERS = [2, 3, 4, 5, 6, 25];

var COLORS = {
  TURQUOISE: new Color(110/255, 177/255, 146/255),
  ORANGE: new Color(231/255, 127/255, 89/255),
  PURPLE: new Color(125/255, 144/255, 189),
  PINK: new Color(206/255, 127/255, 184/255),
  GREEN: new Color(166/255, 201/255, 71/255),
  YELLOW: new Color(249/255, 206/255, 55/255)
};

var AWARD_NAMES = {
  tiles: {
    title: "Most Tiles",
    description: "The winner and greatest speller in the universe with %d tiles."
  },
  attempts: {
    title: "Professional",
    description: "%d% of their attempts were real words."
  },
  worstattempts: {
    title: "Try Hard",
    description: "Only %d% of their submitted words were real."
  },
  
  acquisitions: {
    title: "Colonialist",
    description: "Modern day Christopher Columbus, explored %d tiles."
  },
  steals: {
    title: "Smooth Criminal",
    description: "Stole %d tiles away from other players"
  },
  losses: {
    title: "Clueless Victim",
    description: "Had %d  tiles stolen away from them"
  },
  reinforcements: {
    title: "Turtle",
    description: "\"I like %d turtles\""
  },
  words: {
    title: "Most Words",
    description: "Found %d words"
  },
  worstwords: {
    title: "Least Words",
    description: "Found %d words"
  },
  longestWord: {
    title: "Longfellow",
    description: "The walking dictionary who found a %d letter word."
  },
  worsttiles: {
    title: "Participant",
    description: "They tried so hard to get their measly %d tiles."
  },
  worstacquisitions: {
    title: "Dora the Explorer",
    description: "Literally the worst expolorer ever, only explored %d tiles"
  },
  worststeals: {
    title: "Pacifist",
    description: "Just let players walk all over them and steal %d tiles."
  },
  worstlosses: {
    title: "Untouchable",
    description: "Nobody dares steal their tiles; they only lost %d tiles to others."
  },
  worstreinforcements: {
    title: "Berserker",
    description: "Who needs reinforcements anyway; They only reinforced %d tiles."
  },
  worstlongestWord: {
    title: "Shorty",
    description: "Their longest word was only an embarassing %d characters"
  }
};

function Color(r,g,b) {
  this.r = r;
  this.g = g;
  this.b = b;
};
Color.randomColor = function(i) {
  return COLORS[Object.keys(COLORS)[i%Object.keys(COLORS).length]];
};

function Score(tiles, acquisitions, steals, losses, reinforcements, longestWord, words, attempts) {
  this.tiles = tiles || 0;
  this.acquisitions = acquisitions || 0;
  this.steals = steals || 0;
  this.losses = losses || 0;
  this.reinforcements = reinforcements || 0;
  this.longestWord = longestWord || -1;
  this.words = words || 0;
  this.attempts = attempts || 0;
};

function Player(id, socket, name, color, score, safe) {
  this.id = id;
  this.socket = socket;
  this.color = color;
  this.name = name;
  this.score = score || new Score();

  if (!safe) {
    this.safeCopy = function() {
      return new Player(this.id, null, this.name, this.color, this.score, true);
    };
  }
};

function Tile(letter) {
  this.letter = letter;
  this.owner = null;
  this.strength = null;
  this.randomize = function() {
    this.letter = Tile.randomLetter();
  };
};
Tile.randomLetter = function() {
  return dictionary.makeLetter();
};

function Settings(roundTime, maxPlayers, gridSize, name, password, hackable) {
  this.roundTime = GAME_LENGTHS[roundTime] || DEFAULTS.ROUND_TIME;
  this.maxPlayers = MAX_PLAYERS[maxPlayers] || DEFAULTS.MAX_PLAYERS;
  this.gridSize = GRID_SIZES[gridSize] || DEFAULTS.GRID_SIZE;
  this.name = name || DEFAULTS.NAME;
  this.password = password || DEFAULTS.PASSWORD;
  this.hackable = hackable || DEFAULTS.HACKABLE;
};

function Game(hostPlayer, settings) {
  this.hostId = hostPlayer.id;
  this.started = false;
  this.startTime = null;
  this.id = uuid.v4();
  this.settings = settings || new Settings();
  this.tiles = [];
  for (var i = 0; i < this.settings.gridSize * this.settings.gridSize * 6; i++) {
    this.tiles.push(new Tile(Tile.randomLetter()));
  }

  this.players = {};
  this.players[hostPlayer.id] = hostPlayer;
  this.players[hostPlayer.id].color = Color.randomColor(0);
  var initialPlayer = {};
  initialPlayer[hostPlayer.id] = hostPlayer.safeCopy();

  this.players[hostPlayer.id].socket.emit('players', {
    host: this.hostId,
    players: initialPlayer
  });

  this.start = function(playerId) {
    if (playerId !== this.hostId) {
      return false;
    } else {
      this.started = true;
      this.startTime = new Date();
      var i = 0;
      _.each(this.players, function(player) {
        player.color = Color.randomColor(i);
        i++;
      });

      this.showEveryone('start', this.safeCopy());

      var thisAlias = this;
      this.intervalId = setInterval(function() {
        var currentTime = new Date();
        if ((currentTime - thisAlias.startTime) >= thisAlias.settings.roundTime) {
          thisAlias.showEveryone('gameOver', {
            scores: thisAlias.getPlayerScores(),
            awards: thisAlias.getEndingAwards()
          });

          clearInterval(thisAlias.intervalId);
        }
      }, 1000);

      return true;
    }
  };

  this.addPlayer = function(player, password, callback) {
    var error;
    if (Object.keys(this.players).length >= this.settings.maxPlayers) {
      error = "Game is full";
    } else if (this.started) {
      error = "Game has already begun";
    } else if (this.settings.password !== password) {
      error = "Incorrect password";
    } else if (this.players[player.id]) {
      error = "You are already in this game";
    }

    if (error) {
      return callback(error);
    } else {
      this.players[player.id] = player;
      //this.players[player.id].color = Color.randomColor(Object.keys(this.players).length-1);
      this.recolorPlayers();
      this.players[player.id].score = new Score();

      this.showPlayerList();
      this.showEveryone('chat', {player: player.id, message: 'has joined the game.'});

      return callback();
    }
  };

  this.recolorPlayers = function() {
    var i = 0;

    _.each(this.players, function(player) {
      player.color = Color.randomColor(i);
      i++;
    });
  };

  this.removePlayer = function(player) {
    delete this.players[player.id];
    if (player.id === this.hostId && this.players.length !== 0) {
      this.hostId = Object.keys(this.players)[0];
    }
    this.showEveryone('chat', {player: player.id, message: 'has left the game.'});
    this.showPlayerList();
  };

  this.getPlayersCopy = function() {
    var playersCopy = {};
    _.each(this.players, function(player) {
      playersCopy[player.id] = player.safeCopy();
    });

    return playersCopy;
  };

  this.getPlayerScores = function() {
    var scores = {};
    _.each(this.players, function(player) {
      scores[player.id] = player.score;
    });
    return scores;
  };

  this.getEndingAwards = function() {
    var awards = {};
    _.each(this.players, function(player) {
      
      player.score.attempts = Math.round(player.score.words / player.score.attempts * 100);
      
      _.each(player.score, function(value, key) {
        if (!awards[key]) {
          awards[key] = {player: player.id, value: value};
        } else if (value > awards[key].value) {
          awards[key].player = player.id;
          awards[key].value = value;
        }
        if (!awards["worst"+key]) {
          awards["worst"+key] = {player: player.id, value: value};
        } else if (value < awards[key].value) {
          awards["worst"+key].player = player.id;
          awards["worst"+key].value = value;
        }
      });
    });
    _.each(awards, function(award, key) {
      award.name = AWARD_NAMES[key].title;
      award.description = util.format(AWARD_NAMES[key].description, award.value);
				      
    });
    return awards;
  };

  this.tileUpdate = function(id, tiles) {
    var newOwner = this.players[id];
    if (newOwner.score.longestWord < tiles.length) {
      newOwner.score.longestWord = tiles.length;
    }
    var newTiles = {};
    for (var i = 0; i < tiles.length; i++) {
      var newLetter = Tile.randomLetter();
      var tileToUpdate = this.tiles[tiles[i]];

      var oldOwner = this.players[tileToUpdate.owner];
      if (oldOwner && oldOwner.id) {
        if (oldOwner.id === newOwner.id) {
          // used your own tile
          // increase tile strength if we implement that
          newOwner.score.reinforcements++;
        } else {
          // stole a tile
          oldOwner.score.tiles--;
          newOwner.score.tiles++;
          oldOwner.score.losses++;
          newOwner.score.steals++;
        }
      } else {
        // got an unused tile
        newOwner.score.tiles++;
        newOwner.score.acquisitions++;
      }
      tileToUpdate.owner = id;
      tileToUpdate.letter = newLetter;
      newTiles[tiles[i]] = {owner: id, letter: newLetter};
    }
    return newTiles;
  };

  this.safeCopy = function() {
    var gameClone = _.clone(this);
    gameClone.players = {};
    _.each(this.players, function(player) {
      gameClone.players[player.id] = player.safeCopy();
    });
    return gameClone;
  };

  this.validateWord = function(player, inputTiles) {
    var word = "";
    _.each(inputTiles, function(tile) {
      word += this.tiles[tile].letter;
    }, this);

    this.players[player].score.attempts++;
    if (dictionary.isAWord(word) && pathValidator.isAPath(inputTiles, this.settings.gridSize)) {
      this.players[player].score.words++;
      this.showEveryone('successfulMove', this.tileUpdate(player, inputTiles));
      this.showEveryone('scoreboardUpdate', {
        player: {
          id: player,
          word: word
        },
        scores: this.getPlayerScores()
      });
    } else {
      this.showEveryone('unsuccessfulMove', inputTiles);
    }
  };

  this.showPartialMove = function(tile) {
    this.showEveryone('partialMove', tile);
  };

  this.chat = function(player, message) {
    if (!this.settings.hackable && JSON.stringify(message).indexOf('<script>') !== -1) {
      message = 'Just tried to hack everyone. Shame them.';
    }
    this.showEveryone('chat', {player: player, message: message});
  };

  this.showEveryone = function(message, data) {
    _.each(this.players, function(player) {
      player.socket.emit(message, data);
    });
  };

  this.showPlayerList = function() {
    var data = {
      host: this.hostId,
      players: this.getPlayersCopy()
    };

    this.showEveryone('players', data);
  };

  this.gameListInfo = function() {
    var info = {};
    info.id = this.id;
    info.name = this.settings.name;
    info.password = this.settings.password !== '';
    info.currentPlayers = Object.keys(this.players).length;
    info.maxPlayers = this.settings.maxPlayers;
    info.gridSize = this.settings.gridSize;
    info.roundTime = this.settings.roundTime;
    return info;
  };
};

/**
 * Exports
 */
module.exports = {
  Settings: Settings,
  Game: Game,
  Player: Player,
  DEFAULTS: DEFAULTS
};
