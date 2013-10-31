var Game = require('./server/game');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var _ = require('underscore');
var async = require('async');

// websockets configuration
io.configure(function () {
  io.set('log level', 1);
});

// serve all webui contents statically
app.use('/webui', express.static(__dirname + '/webui'));
app.use('/client', express.static(__dirname + '/client'));

// serve the main game html file
app.get('/', function(req, res) { res.sendfile(__dirname+'/client/worphles.html'); });
app.get('/play', function(req, res) { res.sendfile(__dirname+'/webui/Home.html'); });

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

  socket.on('leaveGame', function(data) {
    removePlayer(thisPlayer);
  });

  socket.on('createGame', function(data) {
    if (!thisPlayer) {
      socket.emit('createFail', {message: 'Please refresh your browser'});
      return;
    }
    var name = data && data.name;
    if (!name) {
      socket.emit('createFail', {message: 'The game needs a name'});
      return;
    }
    var password = data && data.password;
    var size = data && data.size;
    var maxPlayers = data && data.maxPlayers;
    var time = data && data.time;
    var hackable = data && data.hackable;
    var gameSettings = new Game.Settings(time, maxPlayers, size, name, password, hackable);
    var game = new Game.Game(thisPlayer, gameSettings);
    games[game.id] = game;
    socket.emit('gameCreated', {id: game.id});
  });

  socket.on('startGame', function(data) {
    if (!(thisPlayer && thisPlayer.id)) {
      socket.emit('fail');
      return;
    }
    if (!games[thisPlayer.id]) {
      socket.emit('startFail', {message: 'You can\'t start a game unless you\'re the host'});
      return;
    }
    games[thisPlayer.id].start();
    if (!games[thisPlayer.id].started) {
      socket.emit('startFail', {message: 'Not enough players to start'});
      return;
    }
  });

  socket.on('moveComplete', function(data) { games[data.game].validateWord(socket.id, data.tiles); });
  socket.on('partialMove', function(data) { games[data.game].showPartialMove(data); });
  socket.on('chat', function(data) { games[data.game].chat(socket.id, data.message); });
});
