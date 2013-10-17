var bookLoaded = false;

$(document).ready(function() {
	$('#storyButton').click(function() {
    if(!bookLoaded) {
      $('#content').load('webui/views/Storybook.html');
      bookLoaded = true;
    } else {
      $('#myBookContainer').fadeIn();
    }
	});
});