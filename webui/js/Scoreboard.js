function Scoreboard() {

  this.init = function(players) {
    this.players = players ? players : [];

    for(var i = 0; i < Object.keys(players).length; i++) {
      this.createScoreRow(i, players[Object.keys(players)[i]]);
    }

    this.resort();
  }

  /* creates a score row */
  this.createScoreRow = function(num, player) {
    console.log(player)
    var rowId = "playerRow" + num;

    var color = {
      r: (player.color.r * 255),
      g: (player.color.g * 255),
      b: (player.color.b * 255)
    }

    $('<li/>', {
      id: rowId,
      class: 'scoreRow',
      score: player.score,
      height: '18%'
    }).css('background-color', 'rgb('+color.r+','+color.g+','+color.b+')').appendTo('#scores');

    $('<img/>', {
      class: 'avatar'
    }).appendTo('#'+rowId);

    $('<span/>', {
      text: player.name,
      class: 'playerName'
    }).appendTo('#'+rowId);

    $('<span/>', {
      text: player.score,
      class: 'scoreValue'
    }).appendTo('#'+rowId);
  }

  /* updates the score display */
  this.updateScoreDisplay = function(id, score) {
    $("#playerRow" + id + " .scoreValue").text(score);
    $("#playerRow" + id).attr({score: score});
    resort();
  }

  /* resorts the score rows by score */
  this.resort = function() {
    return $('#scores > li').tsort({ order: 'desc', attr: 'score' });
  }
}