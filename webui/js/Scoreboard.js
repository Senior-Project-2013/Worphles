var players = [
  {
      'name': 'Alex',
      'color': '#F55',
      'score': 2400
  }, 
  {
      'name': 'Caleb',
      'color': '#5F5',
      'score': 18
  }, 
  {
      'name': 'Erik',
      'color': '#476',
      'score': 20
  }, 
  {
      'name': 'Jeremy',
      'color': '#725',
      'score': 24
  }, 
  {
      'name': 'Jordon',
      'color': '#337',
      'score': 32
  }
];

$(document).ready(function() {
  for(var p = players.length-1; p >= 0; p--)
    createScoreRow(p, players[p]);

  resort();
});

/* creates a score row */
function createScoreRow(num, player) {
  var rowId = "playerRow" + num;

  $('<li/>', {
    id: rowId,
    class: 'scoreRow',
    score: player.score,
    height: '18%'
  }).css('background-color', player.color).appendTo('#scores');

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
function updateScoreDisplay(id, score) {
  $("#playerRow" + id + " .scoreValue").text(score);
  $("#playerRow" + id).attr({score: score});
  resort();
}

/* resorts the score rows by score */
function resort() {
  return $('#scores > li').tsort({ order: 'desc', attr: 'score' });
}