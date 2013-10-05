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

io.configure(function () {
  if (process.env.HEROKU) {
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10);
  }
  io.set('log level', 1);
});

app.use('/webui', express.static(__dirname + '/webui'));
app.get('/', function(req, res) { res.sendfile(__dirname+'/webui/WorphleWorld.html'); });
app.get('/environment.js', function(req, res) {
  res.setHeader("Content-Type", 'application/javascript');
  res.send('var WEBSOCKETS_URL = \'' + (process.env.WEBSOCKETS_URL || 'http://localhost') +'\';');
});
var players = [];
var game;

server.listen(process.env.PORT || 3000);

io.sockets.on('connection', function(socket) {
  socket.on('disconnect', function() {
    console.log(socket.id,'disconnected');
    _.each(players, function(player, i) {
      if (player.socket.id == socket.id) {
        players.splice(i,1);
      }
    });
  });
  players.push({'socket': socket});

  if (players.length == 6) {
    checkEveryoneStillHere(function(theyreStillHere) {
      if (theyreStillHere) {
        game = Game.newGame(players, Game.defaultSettings());
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

function showQueueUpdate() {
  showEveryone('queue', {currentPlayers: players.length, neededPlayers: 6});
}

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
  if (!tiles.length) {
    return;
  }

  var legalMove = false;

  var word = "";
  _each(tiles, function(tile) {
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
  });
}
