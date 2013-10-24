function MainLobby() {
  this.init = function(lobbies) {
    $('#gameLobbies').empty();
    this.lobbies = lobbies ? lobbies : [];

    for(var i = 0; i < lobbies.length; i++) {
      this.createLobbyRow(lobbies[i]);
    }
  }

  /* creates a lobby row */
  //id    Name    4x4    2/6 players  
  this.createLobbyRow = function(game) {
    $('<li/>', {
      id: game.id,
      class: 'gameLobbyRow'
    }).appendTo($('#gameLobbies'));

    $('<button/>',{
      text: 'Join',
      class: 'gameJoinButton gameJoinButton-Blue',
      onclick: 'joinGame(\''+game.id+'\', '+game.password+');'
    }).appendTo($('#'+game.id));

    $('<span/>', {
      text: game.name,
      class: 'gameName',
    }).appendTo($('#' + game.id));

    $('<span/>', {
      text: game.currentPlayers + '/'+game.maxPlayers + ' Players',
      class: 'gamePlayers',
    }).appendTo($('#' + game.id));

    $('<span/>', {
      text: game.gridSize +'x'+game.gridSize,
      class: 'gameGridSize',
    }).appendTo($('#' + game.id));

    
  }
}