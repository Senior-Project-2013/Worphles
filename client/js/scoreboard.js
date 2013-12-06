function Scoreboard() {

  this.showPopover = function(domId, word) {
    var domElem = $('#'+domId);
    domElem.attr('data-content', word);
    domElem.popover('show');
  };

  this.hidePopover = function(domId) {
    var domElem = $('#'+domId);
    domElem.popover('hide');
  };

  this.update = function(playerInfo) {
    var players = playerInfo.players;
    var host = playerInfo.host;

    $('#scores').empty();
    players = players ? players : {};
    for(var i = 0; i < Object.keys(players).length; i++) {
      this.createScoreRow(i, players[Object.keys(players)[i]], host);
    }
    this.resort();

    $('.scoreRow').popover({
      trigger: 'manual',
      placement: 'right',
      container: 'body'
    });

    $('.scoreRowWrapper').popover({
      trigger: 'click',
      placement: 'bottom',
      container: 'body',
      html: true
    });
  };

  this.createScoreRow = function(num, player, host) {
    $('<div/>', {
      id: 'scoreWrap'+player.id,
      class: 'scoreRowWrapper',
      'data-toggle': 'popover',
      'data-content': '<table>' +
                        '<tr><td class="h3">' + player.name + '</td></tr>' +
                        '<tr><td>Wins: ' + player.stats.wins + '</td></tr>' +
                        '<tr><td>Games Played: ' + player.stats.gamesPlayed + '</td></tr>' +
                        '<tr><td>Longest Word Ever Spelled: \'' + player.stats.longestWord + '\'</td></tr>' +
                      '</table>'
    }).appendTo('#scores');

    $('<li/>', {
      id: 'score'+player.id,
      class: 'scoreRow',
      score: player.score.tiles,
      'data-toggle': 'popover',
      'data-content': 'hello'
    }).css('background-color', getCSSColorFromColor(player.color)).appendTo('#scoreWrap'+player.id);

    $('<h1/>', {
      text: player.name,
      class: 'pull-left scoreText'
    }).appendTo('#score'+player.id);

    if(host === player.id) {
      $('<i/>', {
        class: 'fa fa-star'
      }).prependTo('#score'+player.id+" h1:first");
    }

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
