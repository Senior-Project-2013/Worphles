$(document).ready(function() {
	$('#storyButton').click(function() {
		console.log('HERE IT IS');
		$('#centerContent').load('../views/worphlestory.html');
	});
});
