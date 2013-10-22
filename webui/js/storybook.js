var bookLoaded = false;

$(document).ready(function() {
	$('#storyButton').click(function() {
    if(!bookLoaded) {
      hideContentDivs();
      $('#storyBookContainer').fadeIn();
      $('#storyBookContainer').load('webui/views/Storybook.html');
      bookLoaded = true;
    } else {
      hideContentDivs();
      $('#myBookContainer').fadeIn();
    }
	});
});