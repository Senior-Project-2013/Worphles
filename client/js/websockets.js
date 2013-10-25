var socket;

function initWebsockets() {
  socket = io.connect();

  socket.on('full', function(data) {
    $('#queue').text('Sorry, server\'s full');
  });

  socket.on('hi', function(data) {
    $('#startingButtons').fadeOut(function() {
      $('#lobbyButtons').fadeIn();
    });
  });
  
  socket.on('nameFail', function(data) {
    $('#nameForm').fadeIn();
  });

  socket.on('gameCreated', function(data) {
    gameId = data && data.id;
    $('#createGameModal').modal('hide');
    $('#lobbyButtons').fadeOut();
    $('#startGameButton').fadeIn();
    $('#chatBar').fadeIn();
    $('#scoreboard').fadeIn();
  });

  socket.on('createFail', function(data) {
    alert('failed to create game', data);
  });

  socket.on('startFail', function(data) {
    alert('can\'t start because '+data.message);
  });

  socket.on('gameList', showGameList);

  socket.on('joinedGame', function(data) {
    gameId = data && data.id;
    $('#joinGameModal').modal('hide');
    $('#lobbyButtons').fadeOut();
    $('#chatBar').fadeIn();
    $('#scoreboard').fadeIn();
  });

  socket.on('deniedGame', function(data) {
    alert("Couldn't Join");
  });

  socket.on('players', function(thePlayers) {
    me = socket.socket.sessionid;
    players = thePlayers;
    scoreboard.update(thePlayers);
  });

  socket.on('start', function(game) {
    initGame(game);
  });

  socket.on('gameOver', function(data) {
    scene.remove(cube);
    $('#timer').fadeOut();
    console.log("GAME OVER");
    for (var i = 0; i < targetList.length; i++) {
      scene.remove(targetList[i]);
    };
  });

  socket.on('stillhere?', function(data, callback) {
    callback();
  });

  socket.on('successfulMove', function(data) {
    console.log('successfulMove',data);
    for (var i in data) {
      updateTile(i, data[i].letter, data[i].owner);
    }
  });

  socket.on('unsuccessfulMove', function(data) {
    console.log('unsuccessfulMove',data);
    for (var i in data) {
      colorTile(data[i]);
    }
  });

  socket.on('partialMove', function(data) {
    colorTile(data.tile, players[data.player].color);
  });


  socket.on('chat', function(data) {
    console.log('got chat');
    showChat(data.player, data.message);
  });

  socket.on('scoreboardUpdate', function(data) {
    for(var i = 0; i < Object.keys(data).length; i++) {
      console.log(data);
      var playerId = Object.keys(data)[i];
      players[playerId].score = data[playerId].score;
      scoreboard.updateScoreDisplay(playerId, data[playerId]);
    }
  });
}
