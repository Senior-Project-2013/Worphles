function Scoreboard() {
  this.update = function(players) {
    $('#scores').empty();
    this.players = players ? players : {};
    for(var i = 0; i < Object.keys(players).length; i++) {
      this.createScoreRow(i, players[Object.keys(players)[i]]);
    }
    this.resort();
  }

  this.createScoreRow = function(num, player) {
    $('<li/>', {
      id: 'score'+player.id,
      class: 'scoreRow',
      score: player.score
    }).css('background-color', getCSSColorFromColor(player.color)).appendTo('#scores');

    $('<h1/>', {
      text: player.name,
      class: 'pull-left scoreText'
    }).appendTo('#score'+player.id);

    $('<h1/>', {
      text: player.score,
      class: 'pull-right scoreValue scoreText'
    }).appendTo('#score'+player.id);
  }

  this.updateScoreDisplay = function(id, score) {
    console.log('updating score display');
    $("#score" + id + " .scoreValue").text(score);
    $("#score" + id).attr({score: score});
    this.resort();
  }

  this.resort = function() {
    return $('#scores > li').tsort({ order: 'desc', attr: 'score' });
  }
}