var renderer
var mousePosition
var camera
var systemCount = 3
var particleSystems = []
var particleCount = 1500
var xRotationTarget = 0, xRotationDiff = 0
var yRotationTarget = 0, yRotationDiff = 0

function init() {
	/* SCENE */
	scene = new THREE.Scene()
	//scene.fog = new THREE.Fog(0xffffff, 0.5)
	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	/* CAMERA */
	camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 1, 50)
	camera.position.z = 5
	mousePosition = camera.position
	scene.add(camera)

	/* LIGHTS */
	//var directionalLight = new THREE.DirectionalLight(0x999999, 1)
	//directionalLight.distance = 50
	//scene.add(directionalLight)

	/* OBJECTS */
	createParticleSystems()

	/* ACTIONS */
	$(window).resize(onWindowResize)
	$(document).mousemove(handleMouseMove)
	$(document).ready(function() {
	$(document).bind("contextmenu", function(e) {
			return false;
		});
	});

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
		
		if(!((particleSystems[ps].rotation.x < xRotationTarget + 0.1) && (particleSystems[ps].rotation.x > xRotationTarget - 0.1)))
			particleSystems[ps].rotation.x += xRotationDiff / 300
		if(!((particleSystems[ps].rotation.y < yRotationTarget + 0.1) && (particleSystems[ps].rotation.y > yRotationTarget - 0.1)))
			particleSystems[ps].rotation.y += yRotationDiff / 300
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

			particle.originalX *= 25
			particle.originalY *= 25
		}
	}
}

function gatherParticles(event) {
	for(var ps = 0; ps < particleSystems.length; ps++) {
		for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
			var particle = particleSystems[ps].geometry.vertices[p]

			particle.originalX *= .04
			particle.originalY *= .04
		}
	}
}

function genParticleCoordinate() {
	var angle = Math.random() * Math.PI * 2
	return {
		x: (Math.cos(angle) * 0.25) * (Math.random() * 1.2),
		y: (Math.sin(angle) * 0.25) * (Math.random() * 1.2)
	}
}

function createParticleSystems() {
	for(var ps = 0; ps < systemCount; ps++) {
		var particles = new THREE.Geometry(),
			pMaterial = new THREE.ParticleBasicMaterial({
				color: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
				size: 0.05
			})

		for(var p = 0; p < particleCount; p++) {
			var coordinate = genParticleCoordinate()

			var pX = coordinate.x,
				pY = coordinate.y,
				pZ = -Math.random(),
				particle = new THREE.Vector3(pX, pY, pZ)

			particle.speed = (Math.random() * 0.7) + .2
			particle.originalX = pX
			particle.originalY = pY
			particles.vertices.push(particle)
		}

		particleSystem = new THREE.ParticleSystem(particles, pMaterial)
		particleSystem.position.set(0, 0, 0)
		scene.add(particleSystem)
		particleSystems.push(particleSystem)
	}
}
