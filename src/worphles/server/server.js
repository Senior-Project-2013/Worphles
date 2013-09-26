var dictionary = require('./js/dictionary.js')
var pathValidator = require('./js/path_validator.js')
var express = require('express')
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

app.use('/', express.static(__dirname + '/../webui'));
server.listen(3000);

io.sockets.on('connection', function(socket) {
  socket.emit('moveResponse','hi');
  socket.on('moveComplete', function(data) { validateWord(socket, data); });
  socket.on('partialMove', function(data) { showEveryone(socket, data); });
});

function validateWord(socket, data) {
  console.log(data);
  socket.emit('moveResponse',data);
  return;
  var reply = false;
  if (dictionary.isAWord(data.word) && pathValidator.isAPath(data.path))
    reply = true;
  socket.emit('moveResponse', reply);
}

function showEveryone(socket, data) {
  socket.broadcast.emit('partialMove',data);
}
