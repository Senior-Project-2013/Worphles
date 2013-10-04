var Game = require('./server/game'),
    dictionary = require('./server/dictionary.js'),
    pathValidator = require('./server/path_validator.js'),
    letterGrid = require('./server/letter_grid.js'),
    gameSettings = require('./server/game_settings.js').getSettings(),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

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
  players.push({'socket': socket});

  socket.emit('queue',{currentPlayers: players.length, neededPlayers: 6});
  socket.broadcast.emit('queue',{currentPlayers: players.length, neededPlayers: 6});

  if (players.length == 6) {
    game = Game.newGame(players, Game.defaultSettings());
    for (var i = 0; i < players.length; i++) {
      players[i].socket.emit('start',game);
    }
  }

  socket.on('moveComplete', function(data) { validateWord(socket, data); });
  socket.on('partialMove', function(data) { showEveryone('partialMove', data); });
});

function validateWord(socket, tiles) {
  if (!tiles.length) {
    return;
  }

  var legalMove = false;

  var word = ""
  for(var i = 0; i < tiles.length; i++) {
    word += game.tiles[tiles[i]].letter;
  }

  if (dictionary.isAWord(word) && pathValidator.isAPath(tiles, game.settings.gridSize)) {
    showEveryone('successfulMove', {player: game.players[socket.id], newTiles: game.getNewLetters(tiles)});
  } else {
    showEveryone('unsuccessfulMove', tiles);
  }
}

function showEveryone(message, data) {
  for (var i = 0; i < players.length; i++) {
    players[i].socket.emit(message,data);
  }
}
