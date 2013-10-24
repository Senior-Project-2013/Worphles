var Game = require('./server/game'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    _ = require('underscore'),
    async = require('async');

var PLAYERS_TO_START = Game.DEFAULTS.MAX_PLAYERS;

// websockets configuration
io.configure(function () {
  // heroku has websockets in beta!
  if (process.env.USE_POLLING) {
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10);
  }
  io.set('log level', 1);
});

// serve all webui contents statically
app.use('/webui', express.static(__dirname + '/webui'));
app.use('/client', express.static(__dirname + '/client'));

// serve the main game html file
app.get('/play', function(req, res) { res.sendfile(__dirname+'/client/worphles.html'); });

app.get('/', function(req, res) { res.sendfile(__dirname+'/webui/Home.html'); });

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

var games = {};

// start up the server
server.listen(process.env.PORT || 3000);

// handle each new player that connects
io.sockets.on('connection', function(socket) {
  var thisPlayer;
  socket.on('name', function(name) {
    if (name) {
      thisPlayer = new Game.Player(socket.id, socket, name);
      socket.emit('hi', name);
    } else {
      socket.emit('nameFail','youFail');
    }
  });

  socket.on('gameList', function() {
    var gameList = [];
    _.each(games, function(game) {
      if (!game.started) {
        gameList.push( game.gameListInfo() );
      }
    });
    socket.emit('gameList', gameList);
  })

  socket.on('joinGame', function(data) {
    var gameId = data && data.id;
    var password = data && data.password;
    if (gameId && games[gameId]) {
      if (games[gameId].addPlayer(thisPlayer, password)) {
        socket.emit('joinedGame', data);
      } else {
        socket.emit('deniedGame', data);
      }
    }
  });

  socket.on('createGame', function(data) {
    if (!thisPlayer) {
      return socket.emit('nameFail');
    }

    var name = data && data.name;
    var password = data && data.password;
    var size = data && data.size;
    var maxPlayers = data && data.maxPlayers;
    var time = data && data.time;

    var gameSettings = new Game.Settings(time, maxPlayers, size, name, password);
    var game = new Game.Game(thisPlayer, gameSettings);
    games[game.id] = game;

    socket.emit('gameCreated', {id: game.id});
  });

  socket.on('startGame', function(data) {
    if (!(thisPlayer && thisPlayer.id)) {
      return socket.emit('nameFail');
    }
    if (!games[thisPlayer.id]) {
      return socket.emit('startFail', {message: 'You can\'t start a game unless you\'re the host'});
    }
    if (!games[thisPlayer.id].start()) {
      return socket.emit('startFail', {message: 'Not enough players to start'});
    }
  });

  socket.on('moveComplete', function(data) { games[data.game].validateWord(socket.id, data.tiles); });
  socket.on('partialMove', function(data) { games[data.game].showPartialMove(data); });
  socket.on('chat', function(data) { games[data.game].chat(socket.id, data.message); });
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

// send every player in this game something
function showEveryone(game, message, data) {
  _.each((game ? games[game].players : waitingPlayers), function(player) {
    player.socket.emit(message, data);
  });
}
