$('.button').mouseover(function() {
	spreadParticles();
});

$('.button').mouseleave(function() {
	gatherParticles();
	xRotationTarget = 0;
	yRotationTarget = 0;
	xRotationDiff = xRotationTarget - particleSystems[0].rotation.x;
	yRotationDiff = yRotationTarget - particleSystems[0].rotation.y;
});