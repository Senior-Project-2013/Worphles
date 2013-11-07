// constants
var X_AXIS = new THREE.Vector3(1,0,0);
var Y_AXIS = new THREE.Vector3(0,1,0);
var Z_AXIS = new THREE.Vector3(0,0,1);
var NINETY_DEG = 90*Math.PI/180;

// game logic and communication
var socket;           // the socket.io socket for communicating with the server
var gameId;           // the ID of the current game we're in
var me;               // the current player's ID
var players;          // the players in this game
var startTime;        // the time this game started
var timerIntervalId;  // so we can stop the timer
var hackable;         // boolean, whether game allows hacking or not
var scoreboard = new Scoreboard();
var mainLobby = new MainLobby();

// document ready function
$(function() {
  if (Detector.webgl) {
    initWebsockets();
    setupUI();
    initGraphics();
    animate();
  } else {
    $('body').css('backgroundImage','url(/client/images/failure.jpg)');
    $('#everything').fadeOut();
  }
});

function initGame(game) {
  $('#lobbyButtons').fadeOut();
  $('#startGameButton').fadeOut();
  $('#currentWord').fadeIn();
  $('#chatInput').fadeIn();
  $('#gameStatus').fadeIn();
  $('#myBookContainer').fadeOut();

  gameId = game.id;
  me = socket.socket.sessionid;
  players = game.players;
  scoreboard.update({
    players: game.players,
    host: game.hostId
  });
  hackable = game.settings.hackable;
  startTimer(new Date(game.startTime).getTime(), game.settings.roundTime);
  addCube(game.settings, game.tiles);
}

function joinGame(id, hasPassword) {
  if (!id) {
    return;
  }
  var password = '';
  if (hasPassword) {
    password = prompt('Enter Password');
  }
  socket.emit('joinGame', {id: id, password: password});
}

function setupUI() {
  // disable right click on sidebars and background
  $('body').bind('contextmenu', function(e) {
      return false;
  });
  $('.col-md-3').bind('contextmenu', function(e) {
      return false;
  });

  $('body').keypress(function(e) {
    if(e.which === 13) { //enter key
      if($('#createGameModal').is(":visible")) {
        $('#createGameForm').submit();
      } else if($('#nameForm').is(":visible")) {
        $('#nameForm').submit();
      }
    }
  });

  var nameButton = $('#nameButton');
  var nameInput = $('#nameInput');
  nameInput.keyup(function() {
    if(nameInput.val().length < 3) {
      nameButton.attr('disabled', 'disabled');
    } else {
      nameButton.removeAttr('disabled');
    }
  });
  $('#nameButton').click(chooseName);

  var createGameButton = $('#createGameButton');
  var gameNameInput = $('#gameNameInput');
  var gamePasswordInput = $('#gamePasswordInput');
  var gameBoardSizeInput = $('#gameBoardSizeInput');
  var gameNumPlayersInput = $('#gameNumPlayersInput');
  var gameLengthInput = $('#gameLengthInput');
  gameNameInput.keyup(function() {
    if (gameNameInput.val().length >= 3) {
      createGameButton.removeAttr('disabled');
    } else {
      createGameButton.attr('disabled', 'disabled');
    }
  });
  $('#createGameButton').click(createGame);

  $('#joinGameModalShow').click(function() {
    socket.emit('gameList');
    $('#joinGameModal').modal('show');
  });

  $('#startGameButton').click(function() {
    socket.emit('startGame', {
      gameId: gameId,
      playerId: me
    });
  });

  $('#leaveGameButton').click(function() {
    socket.emit('leaveGame');
    hideAllDivs();
    removeCube();
    $('#lobbyButtons').fadeIn();
  });

  $('#createLobby').click(function() {
    if ($('#createLobby').text() === 'Start') {
      return socket.emit('startGame');
    }

    var gInput;
    while(!(gInput && gInput.length == 5)) {
      gInput = prompt('name:password:size:maxPlayers:time').split(':');
    }
    return socket.emit('createGame', {
      name: gInput[0],
      password: gInput[1],
      size: gInput[2],
      maxPlayers: gInput[3],
      time: gInput[4]});
  });

  $('#refresh').click(function() {
    socket.emit('gameList');
  });
}

function showButtons() {
  $('#customGame').fadeIn();
  $('#joinQueue').fadeIn();
}

function chooseName() {
  var name = $('#nameInput').val();
  if (name && name.length >= 3) {
    socket.emit('name', name);
    $('#nameInput').val('');
    $('#nameButton').attr('disabled', 'disabled');
  }
  // stops the form from submitting if being called from HTML form
  return false;
}

function createGame() {
  var gameNameInput = $('#gameNameInput');
  var gamePasswordInput = $('#gamePasswordInput');
  var gameBoardSizeInput = $('#gameBoardSizeInput');
  var gameNumPlayersInput = $('#gameNumPlayersInput');
  var gameLengthInput = $('#gameLengthInput');
  var gameAllowHackingInput = $('#allowHackingInput');

  var name = gameNameInput.val();
  var password = gamePasswordInput.val();
  var size = gameBoardSizeInput.val();
  var players = gameNumPlayersInput.val();
  var length = gameLengthInput.val();
  var hackable = gameAllowHackingInput.prop('checked');

  if (name && size && players && length) {
    var newGame = {name: name, password: password, size: size, maxPlayers: players, time: length, hackable: hackable};
    socket.emit('createGame', newGame);
  }
  // stops the form from submitting if being called from HTML form
  return false;
}

function sendChat(chat) {
  if (chat === undefined) {
    chat = $('#chatInput').val();
  }
  if (chat) {
    socket.emit('chat', {game:gameId, message:chat});
  }
  $('#chatInput').val('');
  // stops the form from submitting if being called from HTML form
  return false;
}

function showChat(data) {
  $('#messages').append('<div class="chatRow" style=background-color:' +
    getCSSColorFromColor(players[data.player].color) + '>' +
    players[data.player].name + ': '+
    escapeHtml(data.message, data.safe) +'</div>'
  );
  $('#messages').scrollTop($('#messages')[0].scrollHeight);
}

function escapeHtml(string, safe) {
  if (safe || hackable) {
    return string;
  } else {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(string));
    return div.innerHTML;
  }
};

function getCSSColorFromColor(color) {
  return getCSSColorFromRGB(color.r, color.g, color.b);
}

function getCSSColorFromRGB(r, g, b) {
  return 'rgb('+(Math.round(r*255))+','+(Math.round(g*255))+','+(Math.round(b*255))+')';
}

function scaledColor(color, scale) {
  var x =  {
    r: (Math.round(color.r * 255) * scale) / 255,
    g: (Math.round(color.g * 255) * scale) / 255, 
    b: (Math.round(color.b * 255) * scale) / 255 
};
  return x;
}


function updateTile(tile, letter, owner) {
  updateTileOwner(tile, owner);
  colorTile(tile, players[owner].color);
  changeTileLetter(tile, letter);
}

function updateWordDisplay(tileNums) {
  var word = '';
  for(var i = 0; i < tileNums.length; i++) {
    word += tiles[tileNums[i]].letter;
  }
  $('#currentWord').text(word);
}

function startTimer(startTime, roundTime) {
  $('#gameStatus > #timer > #time').text((roundTime/1000) - 1);
  timerIntervalId = setInterval(function () {
    currentTime = new Date().getTime();
    if ((currentTime - startTime) >= roundTime) {
      stopTimer();
    } else {
      $('#gameStatus > #timer > #time').text(((roundTime - (currentTime - startTime))/1000) | 0);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerIntervalId);
  $('#gameStatus').fadeOut();
}

function hideAllDivs() {
  $('#startingButtons').fadeOut();
  $('#lobbyButtons').fadeOut();
  $('#scoreboard').fadeOut();
  $('#gameStatus').fadeOut();
  $('#startGameButton').fadeOut();
  $('#leaveGameButton').fadeOut();
  $('#chatBar').fadeOut();
  $('#chat > #messages').empty();
}
