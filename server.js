var dictionary = require(__dirname+'/server/dictionary.js'),
    pathValidator = require(__dirname+'/server/path_validator.js'),
    letterGrid = require(__dirname+'/server/letter_grid.js'),
    gameSettings = require(__dirname+'/server/game_settings.js').getSettings(),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
  io.set('log level', 1);
});

app.use('/webui', express.static(__dirname + '/webui'));
app.get('/', function(req, res) { res.sendfile(__dirname+'/webui/WorphleWorld.html'); });
app.get('/environment.js', function(req, res) {
  res.setHeader("Content-Type", 'application/javascript');
  res.send('var WEBSOCKETS_URL = \'' + (process.env.WEBSOCKETS_URL || 'http://localhost') +'\';');
});

server.listen(process.env.PORT || 3000);

io.sockets.on('connection', function(socket) {
  socket.emit('moveResponse','hi');
  letterGrid.fillGrid(gameSettings['gridSize']);
  gameSettings['letterGrid'] = letterGrid.getGrid();
  socket.emit('setup', gameSettings);
  socket.on('moveComplete', function(data) { validateWord(socket, data); });
  socket.on('partialMove', function(data) { showEveryone(socket, data); });
});

function validateWord(socket, data) {
  var reply = {
    legalMove: false,
    wordTiles: data.WordTiles
  }

  var word = ""
  for(i = 0; i < wordTiles.length, i++) {
    word += wordTiles[i].letter;
  }

  if (dictionary.isAWord(word) && pathValidator.isAPath(data.path)) {
    reply.legalMove = true;
    //look up word value, increment score
  }
  socket.emit('moveResponse', reply);
}

function showEveryone(socket, data) {
  socket.broadcast.emit('partialMove',data);
}