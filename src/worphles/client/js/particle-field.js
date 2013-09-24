var renderer,
	mousePosition,
	camera,
	particleSystems = [],
	settings = {
		systemCount: 3, //the number of particle systems to render, the higher the number the more particles + the more colorful
		particleCount: 6, //the number of particles used for each line.  This number is multiplied by systemCount.
		starCount: 1000, //the number of background particles
		sizeMultiplier: 8, //size increase for spreading particles
		averageParticleSpeed: .5, //lower for faster
		pictureBlur: 0.02 //higher for more blurry
	}

function init() {
	/* SCENE */
	scene = new THREE.Scene()
	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	/* CAMERA */
	camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 1, 50)
	camera.position.z = 4
	mousePosition = camera.position
	scene.add(camera)

	/* OBJECTS */
	createParticleSystems()

	/* ACTIONS */
	$(window).resize(onWindowResize)
	$(document).mousemove(handleMouseMove)

	render()
}

init()

function render() {
	requestAnimationFrame(render)
	
	for(var ps = 0; ps < particleSystems.length; ps++) {
		for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
			var particle = particleSystems[ps].geometry.vertices[p]

			//randomizes target to area around mouse
			var targetX = (mousePosition.x + particle.originalX)
			var targetY = (mousePosition.y + particle.originalY)

			var distanceX = targetX - particle.x
			var distanceY = targetY - particle.y

			particle.x += distanceX / (particle.speed * 50)
			particle.y += distanceY / (particle.speed * 50)
		}

		particleSystems[ps].geometry.verticesNeedUpdate = true
	}

	renderer.render(scene, camera)
}

function onWindowResize(event) {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

function handleMouseMove(event) {
	var vector = new THREE.Vector3(
    	(event.clientX / window.innerWidth) * 2 - 1,
    	-(event.clientY / window.innerHeight) * 2 + 1,
    	0.5)

	var projector = new THREE.Projector()
	projector.unprojectVector(vector, camera)
	var dir = vector.sub(camera.position).normalize()
	var ray = new THREE.Raycaster(camera.position, dir)
	var distance = - camera.position.z / dir.z
	mousePosition = camera.position.clone().add(dir.multiplyScalar(distance))
}

function spreadParticles(event) {
	for(var ps = 0; ps < particleSystems.length; ps++) {
		for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
			var particle = particleSystems[ps].geometry.vertices[p]

			if(particle.spread) {
				particle.originalX *= settings.sizeMultiplier
				particle.originalY *= settings.sizeMultiplier
			}
		}
	}
}

function gatherParticles(event) {
	for(var ps = 0; ps < particleSystems.length; ps++) {
		for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
			var particle = particleSystems[ps].geometry.vertices[p]

			if(particle.spread) {
				particle.originalX *= 1 / settings.sizeMultiplier
				particle.originalY *= 1 / settings.sizeMultiplier
			}
		}
	}
}

function createParticleSystems() {
	/* WORPHLE DRAWING */
	for(var ps = 0; ps < settings.systemCount; ps++) {
		var particles = new THREE.Geometry(),
			pMaterial = new THREE.ParticleBasicMaterial({
				color: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
				size: 0.02
			})

		/* Worphle Coordinates */
		var xStartCoordinates = [-.1825, .1825, .1825, .12, -.1825, -.12, -.1825, .1825, -.13, -.1825, -.13, .1825, .24, .15, .15, .01, .01, .06];
		var yStartCoordinates = [-.1825, -.1825, .1825, .28, .1825, .28, -.1825, -.1825, -.13, 0, -.02, .02, .01, .16, .145, .16, .145, .06];
		var xTargetCoordinates = [-.1825, .1825, .12, 0, -.12, 0, -.13, .13, .13, -.13, -.13, .24, .1825, .165, .165, .025, .025, .10];
		var yTargetCoordinates = [.1825, .1825, .28, .335, .28, .335, -.13, -.13, -.13, -.02, .02, .01, .09, .145, .16, .145, .16, .06];

		for(var i = 0; i < xStartCoordinates.length; i++)
			createWorphleParticles(xStartCoordinates[i], yStartCoordinates[i], xTargetCoordinates[i], yTargetCoordinates[i], particles);

		particleSystem = new THREE.ParticleSystem(particles, pMaterial)
		particleSystem.position.set(0, 0, 0)
		scene.add(particleSystem)
		particleSystems.push(particleSystem)
	}

	/* STARS */
	var particles = new THREE.Geometry,
		pMaterial = new THREE.ParticleBasicMaterial({
			color: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
			size: 0.15
		})

	createStarParticles(particles)

	var starSystem = new THREE.ParticleSystem(particles, pMaterial)
	starSystem.position.set(0, 0, 0)
	scene.add(starSystem)
	particleSystems.push(starSystem)
}

function createWorphleParticles(xStart, yStart, xTarget, yTarget, particles) {
	var xIncrement = (xTarget - xStart) / settings.particleCount,
		yIncrement = (yTarget - yStart) / settings.particleCount

	for(var p = 1; p < settings.particleCount; p++) {
			var blurFactor = (Math.random() * settings.pictureBlur) - settings.pictureBlur;

			var pX = xStart + xIncrement * p + blurFactor,
				pY = yStart + yIncrement * p + blurFactor,
				pZ = (Math.random() * .02) + .02,
				particle = new THREE.Vector3(pX, pY, pZ)

		particle.speed = (Math.random() * settings.averageParticleSpeed) + (settings.averageParticleSpeed / 3)
		particle.originalX = pX
		particle.originalY = pY
		particle.spread = true
		particles.vertices.push(particle)
	}
}

function createStarParticles(particles) {
	for(var s = 0; s < settings.starCount; s++) {
		var pX = (Math.random() * 40) - 20,
			pY = (Math.random() * 20) - 10,
			pZ = (Math.random() * 10) - 24,
			particle = new THREE.Vector3(pX, pY, pZ)

		particle.speed = (Math.random() * 0.6) + .03
		particle.originalX = pX
		particle.originalY = pY
		particle.spread = false
		particles.vertices.push(particle)
	}
}