var testLobbies = [
  {
    id: 1,
    name: 'Super fun game',
    currentPlayers: 1,
    maxPlayers: 6,
    gridSize: 4
  },
  {
    id: 2,
    name: 'GG NOOBS HAVE FUN',
    currentPlayers: 6,
    maxPlayers: 6,
    gridSize: 2
  }
];

function MainLobby() {
  this.init = function(lobbies) {
    this.lobbies = lobbies ? lobbies : [];

    for(var i = 0; i < lobbies.length; i++) {
      this.createLobbyRow(lobbies[i]);
    }
  }

  /* creates a lobby row */
  //id    Name    4x4    2/6 players  
  this.createLobbyRow = function(lobby) {
    $('<li/>', {
      id: lobby.id,
      class: 'gameLobbyRow'
    }).appendTo($('#gameLobbies'));

    $('<button/>',{
      text: 'Join',
      class: 'gameJoinButton gameJoinButton-Blue'
    }).appendTo($('#'+lobby.id));

    $('<span/>', {
      text: lobby.name,
      class: 'gameName',
    }).appendTo($('#' + lobby.id));

    $('<span/>', {
      text: lobby.currentPlayers + '/'+lobby.maxPlayers + ' Players',
      class: 'gamePlayers',
    }).appendTo($('#' + lobby.id));

    $('<span/>', {
      text: lobby.gridSize +'x'+lobby.gridSize,
      class: 'gameGridSize',
    }).appendTo($('#' + lobby.id));

    
  }
}