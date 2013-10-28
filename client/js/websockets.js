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
    $('#timer').fadeOut();
    scene.remove(cube);
    for (var i = 0; i < targetList.length; i++) {
      scene.remove(targetList[i]);
    };
    for(var i = 0; i < Object.keys(data.scores).length; i++) {
      var playerId = Object.keys(data.scores)[i];
      players[playerId].score = data.scores[playerId];
      scoreboard.updateScoreDisplay(playerId, data.scores[playerId]);
    }
    var awardsBody = $('#awardsBody');
    awardsBody.empty();
    for (var i = 0; i < Object.keys(data.awards).length; i++) {
      var key = Object.keys(data.awards)[i];
      var award = data.awards[key];
      
      $('<tr/>', {
        id: key,
        class: 'awardRow'
      }).appendTo(awardsBody);
      var thisAward = $('#'+key);
      $('<td/>',{
        text: award.name,
        class: 'awardName'
      }).appendTo(thisAward);
      // $('<td/>', {
      //   text: award.value,
      //   class: 'awardValue'
      // }).appendTo(thisAward);
      $('<td/>', {
        text: players[award.player].name,
        class: 'awardPlayer'
      }).appendTo(thisAward);
    }
    $('#endGameModal').modal('show');
  });

  socket.on('stillhere?', function(data, callback) {
    callback();
  });

  socket.on('successfulMove', function(data) {
    for (var i in data) {
      updateTile(i, data[i].letter, data[i].owner);
    }
  });

  socket.on('unsuccessfulMove', function(data) {
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

  socket.on('scoreboardUpdate', function(update) {
    var player = update.player;
    var scores = update.scores;
    var popoverId = 'score'+player.id;

    for(var i = 0; i < Object.keys(scores).length; i++) {
      var playerId = Object.keys(scores)[i];
      players[playerId].score = scores[playerId];
      scoreboard.updateScoreDisplay(playerId, scores[playerId]);
    }

    scoreboard.showPopover(popoverId, player.word);
    setTimeout(function() {
      scoreboard.hidePopover(popoverId);
    }, 1000);
  });
}
