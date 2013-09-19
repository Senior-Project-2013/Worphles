var io = require('socket.io')
  , dictionary = require('./js/dictionary.js');
  , pathValidator = require('.js/path_validator.js');

io.sockets.on('connection', function(socket) {
  socket.on('playerMove', function(data) { validateWord(socket, data); });
});

function validateWord(socket, data) {
  var reply = false;
  if (dictionary.isAWord(data.word) && pathValidator.isAPath(data.path))
    reply = true;
  socket.emit("moveResponse", reply);
}