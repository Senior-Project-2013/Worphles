function Scoreboard() {

  this.init = function(players) {
    this.players = players ? players : {};

    for(var i = 0; i < Object.keys(players).length; i++) {
      this.createScoreRow(i, players[Object.keys(players)[i]]);
    }

    this.resort();
  }

  /* creates a score row */
  this.createScoreRow = function(num, player) {
    var color = {
      r: (player.color.r * 255),
      g: (player.color.g * 255),
      b: (player.color.b * 255)
    }
    console.log('creating player',num,player);

    $('<li/>', {
      id: 'score'+player.id,
      class: 'scoreRow',
      score: player.score
    }).css('background-color', 'rgb('+color.r+','+color.g+','+color.b+')').appendTo('#scores');

    $('<h1/>', {
      text: player.name,
      class: 'pull-left'
    }).appendTo('#score'+player.id);

    $('<h1/>', {
      text: player.score,
      class: 'pull-right scoreValue'
    }).appendTo('#score'+player.id);
  }

  /* updates the score display */
  this.updateScoreDisplay = function(id, score) {
    console.log('updating score display');
    $("#score" + id + " .scoreValue").text(score);
    $("#score" + id).attr({score: score});
    this.resort();
  }

  /* resorts the score rows by score */
  this.resort = function() {
    return $('#scores > li').tsort({ order: 'desc', attr: 'score' });
  }
}