$(document).ready(function() {
	$('#storyButton').click(function() {
		$('#myBookContainer').fadeIn();
	});

	$('#myBook > .closeBtn').click(function() {
		myBook.goToPage(0);
		$('#myBookContainer').fadeOut();
	});
});