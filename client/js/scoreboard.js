function Scoreboard() {

  this.showPopover = function(domId, word) {
    var domElem = $('#'+domId);
    domElem.attr('data-content', word);
    domElem.popover('show');
  };

  this.hidePopover = function(domId) {
    var domElem = $('#'+domId);
    domElem.attr('data-content', word);
    domElem.popover('hide');
  };

  this.update = function(players) {
    $('#scores').empty();
    this.players = players ? players : {};
    for(var i = 0; i < Object.keys(players).length; i++) {
      this.createScoreRow(i, players[Object.keys(players)[i]]);
    }
    this.resort();

    $('.scoreRow').popover({
      trigger: 'manual',
      placement: 'right',
      container: 'body'
    });
  };

  this.createScoreRow = function(num, player) {
    $('<li/>', {
      id: 'score'+player.id,
      class: 'scoreRow',
      score: player.score.tiles,
      'data-toggle': 'popover',
      'data-content': 'hello'
    }).css('background-color', getCSSColorFromColor(player.color)).appendTo('#scores');

    $('<h1/>', {
      text: player.name,
      class: 'pull-left scoreText'
    }).appendTo('#score'+player.id);

    $('<h1/>', {
      text: player.score.tiles,
      class: 'pull-right scoreValue scoreText'
    }).appendTo('#score'+player.id);
  };

  this.updateScoreDisplay = function(id, score) {
    $("#score" + id + " .scoreValue").text(score.tiles);
    $("#score" + id).attr({score: score.tiles});
    this.resort();
  };

  this.resort = function() {
    return $('#scores > li').tsort({ order: 'desc', attr: 'score' });
  };
}
