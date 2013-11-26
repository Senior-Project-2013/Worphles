var dictionary = require('./dictionary');
var pathValidator = require('./path_validator.js');
var cubeGrid = require('./cube_grid').getGrid();
var _ = require('underscore');
var uuid = require('node-uuid');
var debug = require('./debug');
var redis;

//redis configuration
if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    redis = require("redis").createClient(rtg.port, rtg.hostname);

    redis.auth(rtg.auth.split(":")[1]);
} else {
    redis = require("redis").createClient(null, null, {
      connect_timeout: 1000
    });
}

redis.on("error", function(err) {
  debug.log('Error ' + err);
  redis = null;
});

/**
 * Replaces matches in string from an object's attributes:
 * 
 * "{name} is {age} years old.".formatFromObject({
 *     name: "Ted",
 *     age: 20
 * }); => "Ted is 20 years old."
 */
var formatFromObject = function(string ,object) {
  return string.replace(/{([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)}/g,
			function(entire, inside) {
                          var value = object[inside];
			  if (value !== null && value != undefined) {
			    return value;
			  }
			  else {
			    debug.err("No match found for key: " + entire +
				      " in object: " + JSON.stringify(object));
			    return "{oops!}";
			  }
			});
};


// all time is in milliseconds
var MS_PER_SEC = 1000;
var MS_PER_MIN = MS_PER_SEC * 60;
var GAME_LENGTHS = [(60 * MS_PER_SEC), (180 * MS_PER_SEC), (300 * MS_PER_SEC)];
var GRID_SIZES = [4, 5, 6, 7, 8];
var MAX_PLAYERS = [2, 3, 4, 5, 6, 25];
var DEFAULTS = {
  ROUND_TIME: GAME_LENGTHS[1],
  MAX_PLAYERS: MAX_PLAYERS[0],
  GRID_SIZE: GRID_SIZES[0],
  NAME: 'Worphles',
  PASSWORD: '',
  HACKABLE: false,
  HARDCORE: false
};

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
    description: "The winner and greatest speller in the universe with {value} tiles is {player}!.",
    icon: "fa-trophy"
  },
  attempts: {
    title: "Sharpshooter",
    description: "{value}% of their attempts were real words.",
    icon: "fa-crosshairs"
  },
  worstattempts: {
    title: "\"How I speil?\"",
    description: "Only {value}% of their submitted words were real.",
    icon: "fa-question"
  },
  acquisitions: {
    title: "Colonialist",
    description: "A Modern day Christopher Columbus! {player} explored {value} tiles.",
    icon: "fa-globe"
  },
  steals: {
    title: "Smooth Criminal",
    description: "Stole {value} tiles away from other players.",
    icon: "fa-money"
  },
  losses: {
    title: "Clueless Victim",
    description: "Had {value} tiles stolen away from them.",
    icon: "fa-shopping-cart"
  },
  reinforcements: {
    title: "Turtle",
    description: "\"I like {value} turtles.\"",
    icon: "fa-bug"
  },
  words: {
    title: "Most Words",
    description: "Found a whopping {value} words!",
    icon: "fa-bolt"
  },
  worstwords: {
    title: "Least Words",
    description: "Found a pathetic {value} words.",
    icon: "fa-fast-backward"
  },
  longestWord: {
    title: "High Roller",
    description: "The walking dictionary who found a {value} letter word.",
    icon: "fa-book"
  },
  worsttiles: {
    title: "Participant",
    description: "They tried so hard to get their measly {value} tiles.",
    icon: "fa-frown-o"
  },
  worstacquisitions: {
    title: "Dora the Explorer",
    description: "Literally the worst expolorer ever, {player} only explored {value} tiles.",
    icon: "fa-female"
  },
  worststeals: {
    title: "Pacifist",
    description: "Stealing {value} tiles went against {player}'s better judgement.",
    icon: "fa-heart"
  },
  worstlosses: {
    title: "Untouchable",
    description: "Nobody dares steal {player}'s tiles! They only lost {value} tiles to others.",
    icon: "fa-lock"
  },
  worstreinforcements: {
    title: "Berserker",
    description: "Who needs reinforcements anyway? They only reinforced {value} tiles.",
    icon: "fa-play"
  },
  worstlongestWord: {
    title: "Shorty",
    description: "Their longest word was only an embarassing {value} characters.",
    icon: "fa-sort-amount-desc"
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

function Stats(id, name, wins, gamesPlayed, longestWord, muted) {
  this.id           = id          || uuid.v4();
  this.name         = name        || "";
  this.wins         = wins        || 0;
  this.gamesPlayed  = gamesPlayed || 0;
  this.longestWord  = longestWord || "";
  this.muted        = muted       || false;
}

function Player(id, stats, socket, name, color, score, safe) {
  this.id = id;
  this.stats = stats;
  this.socket = socket;
  this.color = color;
  this.name = name;
  this.score = score || new Score();
  this.words = [];

  this.getSortedWords = function() {
    this.words.sort(function(a, b) {
      if (a.length > b.length ? 1 : 0);
    });
    return this.words;
  };
  
  this.longestWord = function() {
    var sorted = this.getSortedWords();
    return (sorted.length > 0) ? sorted[0] : null;
  };
  
  if (!safe) {
    this.safeCopy = function() {
      return new Player(this.id, this.stats, null, this.name, this.color, this.score, true);
    };
  }
};

function Tile(letter, owner, strength) {
  this.letter = letter;
  this.owner = owner;
  this.strength = strength || 0;
  this.randomize = function() {
    this.letter = Tile.randomLetter();
  };
};
Tile.randomLetter = function() {
  return dictionary.makeLetter();
};

function Settings(roundTime, maxPlayers, gridSize, name, password, hackable, hardcore) {
  this.roundTime  = GAME_LENGTHS[roundTime] || DEFAULTS.ROUND_TIME;
  this.maxPlayers = MAX_PLAYERS[maxPlayers] || DEFAULTS.MAX_PLAYERS;
  this.gridSize   = GRID_SIZES[gridSize]    || DEFAULTS.GRID_SIZE;
  this.name       = name                    || DEFAULTS.NAME;
  this.password   = password                || DEFAULTS.PASSWORD;
  this.hackable   = hackable                || DEFAULTS.HACKABLE;
  this.hardcore   = hardcore                || DEFAULTS.HARDCORE;
};

function Game(hostPlayer, settings) {
  var thisGame = this; // for any scoping issues, just use this
  this.hostId = hostPlayer.id;
  this.started = false;
  this.startTime = null;
  this.id = uuid.v4();
  this.settings = settings || new Settings();
  this.tiles = [];
  for (var i = 0; i < this.settings.gridSize * this.settings.gridSize * 6; i++) {
    this.tiles.push(new Tile(Tile.randomLetter()));
  }

  this.start = function(playerId) {
    if (playerId !== this.hostId) {
      return false;
    } else {
      this.started = true;
      this.startTime = new Date();
      var i = 0;
      _.each(this.players, function(player) {
        player.color = Color.randomColor(i);
        player.score = new Score();
        i++;
      });

      this.showEveryone('start', this.safeCopy());

      var thisAlias = this;
      this.intervalId = setInterval(function() {
        var currentTime = new Date();
        if ((currentTime - thisAlias.startTime) >= thisAlias.settings.roundTime) {
          thisAlias.showEveryone('gameOver', {
            scores: thisAlias.getPlayerScores(),
            awards: thisAlias.getEndingAwards(),
	          words: thisAlias.getPlayerWords()
          });

          thisAlias.updateSaveData();

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
      this.players[player.id].words = [];
      this.recolorPlayers();
      this.players[player.id].score = new Score();
      this.registerSocketListeners(player);

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

  this.registerSocketListeners = function(player) {
    player.socket.on('moveComplete', function(data) {
      thisGame.validateWord(player.socket.id, data.tiles);
    });
    player.socket.on('partialMove', function(data) {
      thisGame.showPartialMove(data);
    });
    player.socket.on('chat', function(data) {
      thisGame.chat(player.socket.id, data.message);
    });
  };

  this.removeSocketListeners = function(player) {
    player.socket.removeAllListeners('moveComplete');
    player.socket.removeAllListeners('partialMove');
    player.socket.removeAllListeners('chat');
  };

  this.removePlayer = function(player) {
    this.removeSocketListeners(player);
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
  
  this.getPlayerWords = function() {
    var playerWords = {};
    _.each(this.players, function(player) {
      playerWords[player.id] = player.getSortedWords();
    });
    debug.log(playerWords);
    return playerWords;
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
      
      award.description = formatFromObject(AWARD_NAMES[key].description, {
	     value: award.value,
	     player: thisGame.players[award.player].name
      });
      
      award.icon = AWARD_NAMES[key].icon;
    });
    return awards;
  };

  this.updateSaveData = function() {
    if(redis) {
      var winners = this.getWinners();
      _.each(winners, function(winner) {
        winner.stats.wins++;
      });

      _.each(this.players, function(player) {
        player.stats.gamesPlayed++;
        redis.set(player.stats.id, JSON.stringify(player.stats));
      });
    }
  }

  this.getWinners = function() {
    if(this.players === 1) {
      return [];
    }

    var highScore = 0;
    var winners = [];

    _.each(this.players, function(player) {
      if(player.score.tiles > highScore) {
        winners = [];
        winners.push(player);
        highScore = player.score.tiles;
      } else if(player.score.tiles === highScore) {
        winners.push(player);
      }
    });

    return winners;
  }

  this.tileUpdate = function(id, tiles) {
    var newOwner = this.players[id];
    if (newOwner.score.longestWord < tiles.length) {
      newOwner.score.longestWord = tiles.length;
    }
    // all words >= 5 letters get extra strength!! woot
    var strengthToAdd = Math.max(tiles.length - 3, 1);
    var newTiles = {};
    if (thisGame.settings.hardcore) {
      _.each(tiles, function(tileNum) {
        var tile = thisGame.tiles[tileNum];
        var newLetter = Tile.randomLetter();
        var oldOwner = thisGame.players[tile.owner];
        if (oldOwner && oldOwner.id) {
          if (oldOwner.id === newOwner.id) {
            // reinforced a tile
            tile.strength+=strengthToAdd;
            newOwner.score.reinforcements++;
          } else {
            tile.strength-=strengthToAdd;
            if (tile.strength <= 0) {
              // stole a tile
              tile.owner = newOwner.id;
              tile.strength = -tile.strength + 1
              oldOwner.score.tiles--;
              newOwner.score.tiles++;
              oldOwner.score.losses++;
              newOwner.score.steals++;
            }
          }
        } else {
          // got an unused tile (or from someone who quit)
          tile.owner = newOwner.id;
          tile.strength = strengthToAdd;
          newOwner.score.tiles++;
          newOwner.score.acquisitions++;
        }
        tile.randomize();
        newTiles[tileNum] = tile;
      });
    } else {
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
      this.players[player].words.push(word);
      this.players[player].score.words++;
      var updateInfo = this.tileUpdate(player, inputTiles);
      this.showEveryone('successfulMove', updateInfo);
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
    this.showEveryone('chat', {player: player, message: message});
    if (message.indexOf('worph') !== -1) {
      this.showEveryone('chat', {player: player, safe: true, message: '<img src="/client/images/worph.png"></img>'});
    }
    if (message.indexOf('nyan') !== -1) {
      this.showEveryone('chat', {player: player, safe: true, message: '<img src="/client/images/nyan.gif"></img>'});
    }
    if (message.indexOf('fox') !== -1) {
      this.showEveryone('chat', {player: player, safe: true, message: '<img src="/client/images/fox.gif"></img>'});
    }
    if (message.indexOf('hacker') !== -1) {
      this.showEveryone('chat', {player: player, safe: true, message: '<img src="/client/images/nohacks.gif"></img>'});
    }
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

  this.playerWords = {};
  this.playerWords[hostPlayer.id] = [];
  
  this.players = {};
  this.players[hostPlayer.id] = hostPlayer;
  this.players[hostPlayer.id].words = [];
  this.players[hostPlayer.id].color = Color.randomColor(0);
  
  this.registerSocketListeners(hostPlayer);
  var initialPlayer = {};
  initialPlayer[hostPlayer.id] = hostPlayer.safeCopy();

  this.players[hostPlayer.id].socket.emit('players', {
    host: this.hostId,
    players: initialPlayer
  });
};

/**
 * Exports
 */
module.exports = {
  Settings: Settings,
  Game: Game,
  Stats: Stats,
  Player: Player,
  DEFAULTS: DEFAULTS
};
