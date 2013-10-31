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
var scoreboard = new Scoreboard();

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
  $('#gameButtons').fadeOut();
  $('#currentWord').fadeIn();
  $('#chatInput').fadeIn();
  $('#gameStatus').fadeIn();
  $('#myBookContainer').fadeOut();

  gameId = game.id;
  me = socket.socket.sessionid;
  players = game.players;
  scoreboard.update(game.players);
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
  });

  $('#startGameButton').click(function() {
    socket.emit('startGame');
  });

  $('#leaveGameButton').click(function() {
    socket.emit('leaveGame', { gameId: gameId });
    hideAllDivs();
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
    socket.emit('createGame', {name: gInput[0], password: gInput[1], size: gInput[2], maxPlayers: gInput[3], time: gInput[4]});
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
    chat = chat.replace(/nyan/g,'<img src="http://wiki.teamfortress.com/w/images/c/cf/User_Nyan_Cat.gif?t=20110606144207"></img>');
    chat = chat.replace(/fox/g,'<img src="http://2-ps.googleusercontent.com/x/www.thehollywoodgossip.com/images.thehollywoodgossip.com/iu/t_medium_l/v1378552561/what-does-the-fox-say.gif.pagespeed.ce.MDGrwTOrNe.gif"></img>');
    socket.emit('chat', {game:gameId, message:chat});
  }
  $('#chatInput').val('');
  // stops the form from submitting if being called from HTML form
  return false;
}

function showChat(player, message) {
  console.log('show chat',player,message);
  $('#messages').append('<div class="chatRow" style=background-color:'+getCSSColorFromColor(players[player].color)+'>'+players[player].name+': '+message+'</div>');
  $('#messages').scrollTop($('#messages')[0].scrollHeight);
}

function getCSSColorFromColor(color) {
  return getCSSColorFromRGB(color.r, color.g, color.b);
}

function getCSSColorFromRGB(r, g, b) {
  return 'rgb('+(Math.round(r*255))+','+(Math.round(g*255))+','+(Math.round(b*255))+')';
}

function showGameList(data) {
  var games = [];
  for (var i = 0; i < data.length; i++) {
    games.push({id: data[i].id, name: data[i].name, currentPlayers: data[i].currentPlayers, maxPlayers: data[i].maxPlayers, gridSize: data[i].gridSize, password: data[i].password});
  }
  if (games.length) {
    var gameListDiv = $('#gameListBody').empty();
    for (var i = 0; i < games.length; i++) {
      var game = games[i];
      
      $('<tr/>', {
        id: game.id,
        class: 'gameLobbyRow'
      }).appendTo($('#gameListBody'));

      var thisGame = $('#'+game.id);

      $('<button/>',{
        text: 'Join',
        class: 'btn btn-primary',
        onclick: 'joinGame(\''+game.id+'\', '+game.password+');'
      }).appendTo(thisGame);

      $('<td/>',{
        text: game.name,
        class: 'gameName'
      }).appendTo(thisGame);
      $('<td/>', {
        text: game.gridSize +'x'+game.gridSize,
        class: 'gameGridSize',
      }).appendTo(thisGame);
      $('<td/>', {
        text: game.currentPlayers + '/'+game.maxPlayers + ' Players',
        class: 'gamePlayers',
      }).appendTo(thisGame);
    }
    $('#joinGameModal').modal('show');
  } else {
    alert('Sorry, there are no games. Please create one.');
  }
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
}