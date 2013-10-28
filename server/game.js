var dictionary = require('./dictionary');
var pathValidator = require('./path_validator.js');
var cubeGrid = require('./cube_grid').getGrid();
var _ = require('underscore');

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
  tiles: "Most Tiles",
  acquisitions: "Colonialist",
  steals: "Thief",
  losses: "Loser",
  reinforcements : "Hermit",
  longestWord: "Longfellow",
  worsttiles: "Least Tiles",
  worstacquisitions: "Dora the Explorer",
  worststeals: "Cop",
  worstlosses: "Pacifist",
  worstreinforcements : "Traitor",
  worstlongestWord: "Shorty"
};

function Color(r,g,b) {
  this.r = r;
  this.g = g;
  this.b = b;
};
Color.randomColor = function(i) {
  return COLORS[Object.keys(COLORS)[i%Object.keys(COLORS).length]];
};

function Score(tiles, acquisitions, steals, losses, reinforcements, longestWord) {
  this.tiles = tiles || 0;
  this.acquisitions = acquisitions || 0;
  this.steals = steals || 0;
  this.losses = losses || 0;
  this.reinforcements = reinforcements || 0;
  this.longestWord = longestWord || -1;
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
  this.started = false;
  this.startTime = null;
  this.id = hostPlayer.id;
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
  this.players[hostPlayer.id].socket.emit('players', initialPlayer);

  this.start = function() {
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
        thisAlias.showEveryone('gameOver', {scores: thisAlias.getPlayerScores(), awards: thisAlias.getEndingAwards()});
        clearInterval(thisAlias.intervalId);
      }
    }, 1000);
    return true;
  };

  this.addPlayer = function(player, password) {
    if (this.settings.password !== password) {
      return false;
    }
    if (Object.keys(this.players).length >= this.settings.maxPlayers) {
      return false;
    } 
    if (this.started) {
      return false;
    }
    if (this.players[player.id]) {
      return false;
    }
    this.players[player.id] = player;
    this.players[player.id].color = Color.randomColor(Object.keys(this.players).length-1);

    var playersCopy = {};
    _.each(this.players, function(player) {
      playersCopy[player.id] = player.safeCopy();
    });
    this.showEveryone('players',playersCopy);
    return true;
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
      award.name = AWARD_NAMES[key];
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

    if (dictionary.isAWord(word) && pathValidator.isAPath(inputTiles, this.settings.gridSize)) {
      this.showEveryone('successfulMove', this.tileUpdate(player, inputTiles));
      this.showEveryone('scoreboardUpdate', {
        player: {
          id: player.id,
          word: word
        },
        scores: this.getPlayerScores();
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
