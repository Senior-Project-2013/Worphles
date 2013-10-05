var Game = require('./server/game'),
    dictionary = require('./server/dictionary.js'),
    pathValidator = require('./server/path_validator.js'),
    letterGrid = require('./server/letter_grid.js'),
    gameSettings = require('./server/game_settings.js').getSettings(),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    _ = require('underscore'),
    async = require('async');

var PLAYERS_TO_START = 6;

// websockets configuration
io.configure(function () {
  // heroku doesn't use real websockets
  if (process.env.HEROKU) {
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10);
  }
  io.set('log level', 1);
});
// let client know if we're on localhost or not
app.get('/environment.js', function(req, res) {
  res.setHeader("Content-Type", 'application/javascript');
  res.send('var WEBSOCKETS_URL = \'' + (process.env.WEBSOCKETS_URL || 'http://localhost') +'\';');
});

// serve all webui contents statically
app.use('/webui', express.static(__dirname + '/webui'));

// serve the main game html file
app.get('/', function(req, res) { res.sendfile(__dirname+'/webui/WorphleWorld.html'); });

// set the max number of players
app.get('/maxPlayers/:num', function(req, res) {
  if (req.params.num > 1) {
    PLAYERS_TO_START=req.params.num;
    res.send('Now expecting '+PLAYERS_TO_START+' players');
    showQueueUpdate();
  } else {
    res.send('You fool of a Took!');
  }
});
var players = [];
var game;

// start up the server
server.listen(process.env.PORT || 3000);

// handle each new player that connects
io.sockets.on('connection', function(socket) {
  socket.on('disconnect', function() {
    console.log(socket.id,'disconnected');
    _.each(players, function(player, i) {
      if (player.socket.id == socket.id) {
        players.splice(i,1);
      }
    });
    showQueueUpdate();
  });
  players.push({'socket': socket});

  if (players.length == PLAYERS_TO_START) {
    showEveryone('queue',{almostReady:true});
    checkEveryoneStillHere(function(theyreStillHere) {
      if (theyreStillHere) {
        game = new Game.Game(players, new Game.Settings(null, PLAYERS_TO_START, null));
        showEveryone('start',game);
      } else {
        showQueueUpdate();
      }
    });
  } else {
    showQueueUpdate();
  }

  socket.on('moveComplete', function(data) { validateWord(socket, data); });
  socket.on('partialMove', function(data) { showEveryone('partialMove', data); });
});

// tell all waiting players the queue status
function showQueueUpdate() {
  showEveryone('queue', {currentPlayers: players.length, neededPlayers: PLAYERS_TO_START});
}

// make sure everyone who's waiting to play is still around
function checkEveryoneStillHere(callback) {
  async.map(players, checkStillHere, function(err, thoseStillHere) {
    var everyoneHere = true;
    if (err) {
      console.log('everyonestillhereerr',err);
      everyoneHere = false;
    } else {
      for (var i = thoseStillHere.length-1; i >= 0; i--) {
        if (!thoseStillHere[i]) {
          console.log('removing player',players[i].socket.id);
          players.splice(i,1);
          everyoneHere = false;
        }
      }
    }
    callback(everyoneHere);
  });
}

// make sure this player is still waiting to play
function checkStillHere(player, callback) {
  var responded = false;
  player.socket.emit('stillhere?', 'plzrespond', function(err, res) {
    responded = true;
    console.log('player',player.socket.id,'responded');
    callback(null, true);
  });
  setTimeout(function() {
    if (!responded) {
      console.log('player',player.socket.id,'did not respond');
      callback(null, false);
    }
  }, 500);
}

function validateWord(socket, tiles) {
// validate a word that's trying to be played
  if (!tiles.length) {
    return;
  }

  var legalMove = false;

  var word = "";
  _.each(tiles, function(tile) {
    word += game.tiles[tile].letter;
  });

  if (dictionary.isAWord(word) && pathValidator.isAPath(tiles, game.settings.gridSize)) {
    showEveryone('successfulMove', game.tileUpdate(socket.id, tiles));
  } else {
    showEveryone('unsuccessfulMove', tiles);
  }
}

function showEveryone(message, data) {
  _.each(players, function(player) {
    player.socket.emit(message, data);
// send every player in this game something
  });
}
