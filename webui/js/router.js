$(document).ready(function() {
  $('#playButton').click(function() {
    $('#bodyContent').empty();
    $('#bodyContent').load('webui/WorphleWorld.html');
  });
});