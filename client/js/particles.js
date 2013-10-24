var renderer;
var scene;
var mousePosition;
var camera;
var particleSystems = [];
var settings = {
  systemCount: 3, //the number of particle systems to render, the higher the number the more particles + the more colorful
  particleCount: 20, //the number of particles used for each line.  This number is multiplied by systemCount.
  starCount: 500, //the number of background particles
  sizeMultiplier: 2, //size increase for spreading particles
  averageParticleSpeed: .3, //lower for faster
  pictureBlur: .02 //higher for more blurry
};

var SCALE = 5;
var WS = 80;

function renderParticles() {
  for(var ps = 0; ps < particleSystems.length; ps++) {
    for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
      var particle = particleSystems[ps].geometry.vertices[p];

      //randomizes target to area around mouse
      var targetX = (mousePosition.x + particle.originalX);
      var targetY = (mousePosition.y + particle.originalY);

      var distanceX = targetX - particle.x;
      var distanceY = targetY - particle.y;

      particle.x += distanceX / (particle.speed * 50);
      particle.y += distanceY / (particle.speed * 50);
    }
    particleSystems[ps].geometry.verticesNeedUpdate = true;
  }
}

function handleMouseMove(event) {
  var vector = new THREE.Vector3(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5);

  var projector = new THREE.Projector();
  projector.unprojectVector(vector, camera);
  var dir = vector.sub(camera.position).normalize();
  var ray = new THREE.Raycaster(camera.position, dir);
  var distance = - camera.position.z / dir.z;
  mousePosition = camera.position.clone().add(dir.multiplyScalar(distance));
}

function spreadParticles(event) {
  for(var ps = 0; ps < particleSystems.length; ps++) {
    for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
      var particle = particleSystems[ps].geometry.vertices[p];

      if(particle.spread) {
        particle.originalX *= settings.sizeMultiplier;
        particle.originalY *= settings.sizeMultiplier;
      }
    }
  }
}

function gatherParticles(event) {
  for(var ps = 0; ps < particleSystems.length; ps++) {
    for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
      var particle = particleSystems[ps].geometry.vertices[p]

      if(particle.spread) {
        particle.originalX *= 1 / settings.sizeMultiplier;
        particle.originalY *= 1 / settings.sizeMultiplier;
      }
    }
  }
}

function createParticleSystems(theScene, theCamera) {
  scene = theScene;
  camera = theCamera;
  mousePosition = camera.position

  /* WORPHLE DRAWING */
  for(var ps = 0; ps < settings.systemCount; ps++) {
    var particles = new THREE.Geometry(),
      pMaterial = new THREE.ParticleBasicMaterial({
        color: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
        size: 0.02*WS/2
      })

    /* Worphle Coordinates */
    var xStartCoordinates = [-.1825*WS, .1825*WS, .1825*WS, .12*WS, -.1825*WS, -.12*WS, -.1825*WS, .1825*WS, -.13*WS, -.1825*WS, -.13*WS, .1825*WS, .24*WS, .15*WS, .15*WS, .01*WS, .01*WS, .06*WS];
    var yStartCoordinates = [-.1825*WS, -.1825*WS, .1825*WS, .28*WS, .1825*WS, .28*WS, -.1825*WS, -.1825*WS, -.13*WS, 0*WS, -.02*WS, .02*WS, .01*WS, .16*WS, .145*WS, .16*WS, .145*WS, .06*WS];
    var xTargetCoordinates = [-.1825*WS, .1825*WS, .12*WS, 0*WS, -.12*WS, 0*WS, -.13*WS, .13*WS, .13*WS, -.13*WS, -.13*WS, .24*WS, .1825*WS, .165*WS, .165*WS, .025*WS, .025*WS, .10*WS];
    var yTargetCoordinates = [.1825*WS, .1825*WS, .28*WS, .335*WS, .28*WS, .335*WS, -.13*WS, -.13*WS, -.13*WS, -.02*WS, .02*WS, .01*WS, .09*WS, .145*WS, .16*WS, .145*WS, .16*WS, .06*WS];

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
      size: 0.2*SCALE*1.5
    })

  createStarParticles(particles)

  var starSystem = new THREE.ParticleSystem(particles, pMaterial)
  starSystem.position.set(0, 0, 0)
  scene.add(starSystem)
  particleSystems.push(starSystem)

  $(document).mousemove(handleMouseMove);
  $('.btn').mouseover(function() {
    spreadParticles();
  });
  $('.btn').mouseleave(function() {
    gatherParticles();
  });
  renderParticles();
}

function createWorphleParticles(xStart, yStart, xTarget, yTarget, particles) {
  var xIncrement = (xTarget - xStart) / settings.particleCount,
    yIncrement = (yTarget - yStart) / settings.particleCount

  for(var p = 1; p < settings.particleCount; p++) {
      var blurFactor = (Math.random() * settings.pictureBlur) - settings.pictureBlur;
      blurFactor *= WS;

      var pX = xStart + xIncrement * p + blurFactor,
        pY = yStart + yIncrement * p + blurFactor,
        pZ = (Math.random() * .02) + .02,
        particle = new THREE.Vector3(pX, pY, pZ)

    particle.speed = (Math.random() * settings.averageParticleSpeed) + (settings.averageParticleSpeed / 3);
    particle.originalX = pX;
    particle.originalY = pY;
    particle.spread = true;
    particles.vertices.push(particle);
  }
}

function createStarParticles(particles) {
  for(var s = 0; s < settings.starCount; s++) {
    var pX = SCALE*((Math.random() * 80) - 40);
    var pY = SCALE*((Math.random() * 80) - 40);
    var pZ = ((Math.random() * 10) - 24);
    var particle = new THREE.Vector3(pX, pY, pZ)
    console.log(particle)

    particle.speed = (Math.random() * 0.6) + .03;
    particle.originalX = pX;
    particle.originalY = pY;
    particle.spread = false;
    particles.vertices.push(particle);
  }
}
