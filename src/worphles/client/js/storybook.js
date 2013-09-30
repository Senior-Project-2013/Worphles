$(document).ready(function() {
	$('#storyButton').click(function() {
		$('#bookContainer').fadeIn();
	});

	$('#bookContainer > .closeBtn').click(function() {
		myBook.goToPage(0);
		$('#bookContainer').fadeOut();
	});
});