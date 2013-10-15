var Game = require('./server/game'),
    dictionary = require('./server/dictionary.js'),
    pathValidator = require('./server/path_validator.js'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    _ = require('underscore'),
    async = require('async');

var PLAYERS_TO_START = Game.DEFAULTS.MAX_PLAYERS;

// websockets configuration
io.configure(function () {
  // heroku doesn't use real websockets
  if (process.env.HEROKU) {
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10);
  }
  io.set('log level', 1);
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

// stop the current game
app.get('/restart', function(req, res) {
  _.each(Object.keys(games), function(game) {
    delete games[game];
  });
  res.send('restarted');
});

var waitingPlayers = [];
var games = {};

// start up the server
server.listen(process.env.PORT || 3000);

// handle each new player that connects
io.sockets.on('connection', function(socket) {
  socket.on('joinQueue', function() {
    // heroku's kinda slow... probably shouldn't do multiple games
    if (process.env.HEROKU && Object.keys(games).length > 0) {
      socket.emit('full');
      return;
    }

    socket.on('disconnect', function() {
      console.log(socket.id,'disconnected');
      _.each(waitingPlayers, function(player, i) {
        if (player.id == socket.id) {
          waitingPlayers.splice(i,1);
        }
      });
      showQueueUpdate();
    });

    waitingPlayers.push(new Game.Player(socket.id, socket, Game.Player.randomColor(waitingPlayers.length), "Player " + waitingPlayers.length));

    if (waitingPlayers.length == PLAYERS_TO_START) {
      showEveryone(null, 'queue',{almostReady:true});
      checkEveryoneStillHere(function(theyreStillHere) {
        if (theyreStillHere) {
          var newGameId = waitingPlayers[0].id;
          games[newGameId] = new Game.Game(newGameId, waitingPlayers, new Game.Settings(null, PLAYERS_TO_START, null));
          showEveryone(null,'start',games[newGameId].safeCopy());
          waitingPlayers.length = 0;
        } else {
          showQueueUpdate();
        }
      });
    } else {
      showQueueUpdate();
    }
  });

  socket.on('moveComplete', function(data) { validateWord(data.game, socket.id, data.tiles); });
  socket.on('partialMove', function(data) { showEveryone(data.game, 'partialMove', data); });
  socket.on('chat', function(data) {showEveryone(data.game, 'chat', {player:socket.id, message:data.message})});
});

// tell all waiting players the queue status
function showQueueUpdate() {
  showEveryone(null,'queue', {currentPlayers: waitingPlayers.length, neededPlayers: PLAYERS_TO_START});
}

// make sure everyone who's waiting to play is still around
function checkEveryoneStillHere(callback) {
  async.map(waitingPlayers, checkStillHere, function(err, thoseStillHere) {
    var everyoneHere = true;
    if (err) {
      console.log('everyonestillhereerr',err);
      everyoneHere = false;
    } else {
      for (var i = thoseStillHere.length-1; i >= 0; i--) {
        if (!thoseStillHere[i]) {
          console.log('removing player',waitingPlayers[i].id);
          waitingPlayers.splice(i,1);
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
    console.log('player',player.id,'responded');
    callback(null, true);
  });
  setTimeout(function() {
    if (!responded) {
      console.log('player',player.id,'did not respond');
      callback(null, false);
    }
  }, 500);
}

// validate a word that's trying to be played
function validateWord(game, player, tiles) {
  if (!tiles.length) {
    return;
  }

  var legalMove = false;

  var word = "";
  _.each(tiles, function(tile) {
    word += games[game].tiles[tile].letter;
  });

  if (dictionary.isAWord(word) && pathValidator.isAPath(tiles, games[game].settings.gridSize)) {
    showEveryone(game, 'successfulMove', games[game].tileUpdate(player, tiles));
    showEveryone(game, 'scoreboardUpdate', updatePlayerScores(games[game]));
  } else {
    showEveryone(game, 'unsuccessfulMove', tiles);
  }
}

// send every player in this game something
function showEveryone(game, message, data) {
  _.each((game ? games[game].players : waitingPlayers), function(player) {
    player.socket.emit(message, data);
  });
}

//update the player scores hash out of the game's player objects
function updatePlayerScores(game) {
  var playerScores = {};

  for(var i = 0; i < Object.keys(game.players).length; i++) {
    var playerId = Object.keys(game.players)[i];
    playerScores[playerId] = game.players[playerId].score;
  }

  console.log(playerScores);
  return playerScores;
}
