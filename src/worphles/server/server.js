var io = require('socket.io').listen(3000)
  , dictionary = require('./js/dictionary.js')
  , pathValidator = require('./js/path_validator.js');

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
