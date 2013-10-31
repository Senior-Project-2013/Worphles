var scene;              // the threejs scene
var camera;             // the threejs camera
var renderer;           // the threejs renderer
var projector;          // the threejs projector
var clock;              // the threejs clock
var controls;           // the threejs controls
var mouse;              // our handy mouse state object
var cube;               // our cube world mesh
var tiles;              // the list of tile meshes and data about them
var targetList = [];    // the list of tile hit targets for intersecting with mouse
var currentTiles = [];  // the currently selected tiles
var lastTile;           // the last tile that was selected

function initGraphics()  {
  var GAME_WIDTH = window.innerWidth/2;
  var GAME_HEIGHT = window.innerHeight; 
  var ASPECT = GAME_WIDTH / GAME_HEIGHT;
  var VIEW_ANGLE = 45;
  var NEAR = 0.1;
  var FAR = 20000;

  mouse = { x: 0, y: 0, lClicked: false, rClicked: false};
  scene = new THREE.Scene();
  projector = new THREE.Projector();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.position.set(0,150,400);
  camera.lookAt(scene.position);
  scene.add(camera);
  renderer = new THREE.WebGLRenderer( {antialias:true} );
  renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
  document.getElementById('graphics').appendChild(renderer.domElement);
  THREEx.WindowResize(renderer, camera);
  controls = new THREE.OrbitControls( camera, renderer.domElement );

  var light = new THREE.PointLight(0xffffff);
  light.position.set(0,250,0);
  scene.add(light);
  var ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);

  createParticleSystems();

  document.addEventListener( 'mousedown', mouseDown, false );
  document.addEventListener( 'mousemove', mouseMove, false );
}

function animate() {
  requestAnimationFrame(animate);
  renderParticles();
  renderer.render(scene, camera);
  update();
}

function update() {
  var delta = clock.getDelta(); 
  if (mouse.x !== -2) {
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );
    var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    var intersects = ray.intersectObjects( targetList );
    if ( intersects.length > 0) {
      var tile = intersects[0].object.__tile_data.num;
      if (mouse.lClicked && !mouse.rClicked && tile != lastTile) {
        socket.emit('partialMove', {game:gameId, tile:tile, player:me});
        colorTile(tile, players[me].color);
        currentTiles.push(tile);
        updateWordDisplay(currentTiles);
        lastTile = tile;
      }
    }
  }
  controls.update();
}

function TileGraphicsSettings(tilesPerRow, tileSize) {
  this.tilesPerRow = tilesPerRow,
  this.tilesPerSide = tilesPerRow*tilesPerRow,
  this.tileSize = tileSize,
  this.tilePadding = tileSize*0.25,
  this.hitBoxSize = tileSize*0.75,
  this.hitBoxStart = 0.5*tileSize*(tilesPerRow%2+1*((tilesPerRow%2)?-1:1)) + Math.floor((tilesPerRow-0.5)/2)*tileSize;

  var floorTexture = new THREE.ImageUtils.loadTexture( 'client/images/tile.png' );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  floorTexture.repeat.set( 1, 1 );
  this.tileMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
  this.floorGeometry = new THREE.PlaneGeometry(this.hitBoxSize,this.hitBoxSize);
}

function addCube(inputSettings, inputTiles) {
  var cubeSize = 80;
  var tilesPerRow = inputSettings.gridSize;
  var tileSize = cubeSize / tilesPerRow;
  var gSettings = new TileGraphicsSettings(tilesPerRow, tileSize);

  var cubeGeometry = new THREE.CubeGeometry(79.9, 79.9, 79.9, 4, 4, 4);
  var cubeTexture = new THREE.ImageUtils.loadTexture('client/images/tile.png');
  cubeTexture.wrapS = cubeTexture.wrapT = THREE.RepeatWrapping;
  cubeTexture.repeat.set(gSettings.tilesPerRow, gSettings.tilesPerRow);
  var cubeMaterial = new THREE.MeshBasicMaterial({map:cubeTexture});
  cube = new THREE.Mesh(cubeGeometry.clone(), cubeMaterial);
  cube.position.set(0, 0, 0);
  scene.add(cube);

  tiles = new Array(gSettings.tilesPerSide*6);
  for (var side = 0; side < 6; side++) {
    for (var row = 0; row < gSettings.tilesPerRow; row++) {
      for (var col = 0; col < gSettings.tilesPerRow; col++) {
        var tileNum = side*gSettings.tilesPerSide + row*gSettings.tilesPerRow + col;
        var _side = side;
        var _axis = Y_AXIS;
        if (side == 4) {
          _side = 1;
          _axis = X_AXIS;
        } else if (side == 5) {
          _side = -1;
          _axis = X_AXIS;
        }
        makeTile(_side, _axis, col, row, tileNum, inputTiles[tileNum].letter, gSettings);
      }
    }
  }
}

function Tile(num, letter, letterResources, color, geometry, material) {
  this.num = num;
  this.letter = letter;
  this.letterResources = letterResources;
  this.color = color;
  this.geometry = geometry;
  this.faces = geometry.faces;
  this.material = material;
  this.owner = null;
};

function makeTile(side, axis, x, y, num, letter, gSettings) {
  var rotation_matrix = new THREE.Matrix4().makeRotationAxis(axis, NINETY_DEG*side );
  var thisGeometry = gSettings.floorGeometry.clone();
  var thisMaterial = gSettings.tileMaterial.clone();
  var tile = new THREE.Mesh(thisGeometry, thisMaterial);
  var tileCoordX = -gSettings.hitBoxStart + gSettings.tileSize*x;
  var tileCoordY = -gSettings.hitBoxStart + gSettings.tileSize*y;
  tile.position.x = tileCoordX;
  tile.position.y = tileCoordY;
  tile.position.z = 40;
  tile.position.applyMatrix4(rotation_matrix);
  tile.rotateOnAxis( axis, NINETY_DEG*side );
  targetList.push(tile);
  scene.add(tile);

  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  context.font = "Bold 150px Arial";
  context.fillStyle = "rgba(0,0,0,1)";
  context.fillText(letter||'0', 100, 130);
  var texture = new THREE.Texture(canvas) ;
  texture.needsUpdate = true;
  var material = new THREE.MeshBasicMaterial( {map: texture, side:THREE.DoubleSide } );
  material.transparent = true;
  var letterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(gSettings.hitBoxSize, gSettings.hitBoxSize),
    material
  );
  letterMesh.position.set(tileCoordX, tileCoordY, 40.01);
  letterMesh.position.applyMatrix4(rotation_matrix);
  letterMesh.rotateOnAxis( axis, NINETY_DEG*side);
  scene.add(letterMesh);

  var thisTile = new Tile(num, letter, {canvasHeight: canvas.height, canvasWidth: canvas.width, letterContext: context, letterTexture: texture}, null, thisGeometry, thisMaterial);
  tile.__tile_data = thisTile;
  tiles[num] = thisTile;
}

function mouseMove(event)  {
  updateMouse(event);
}

function mouseDown(event)  {
  if (event.button == 1) {
    return;
  }
  if (event.button == 2) {
    mouse.rClicked = true;
    document.addEventListener( 'mouseup', mouseUp, false );
    return;
  }
  mouse.lClicked = true;
  document.addEventListener( 'mouseup', mouseUp, false );
  updateMouse(event);
}

function mouseUp(event) {
  if (event.button == 1) {
    return;
  }
  if (event.button == 2) {
    mouse.rClicked = false;
    return;
  }
  document.removeEventListener( 'mouseup', mouseUp, false );
  mouse.lClicked = false;
  if (currentTiles.length) {
    socket.emit('moveComplete', {game:gameId, tiles:currentTiles});
  }
  currentTiles = [];
  lastTile = null;

  $('#currentWord').text('');
}

function updateMouse(event) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // mouse is outside of graphics box
  if (mouse.x < -0.5 || mouse.x > 0.5) {
    mouse.x = -2;
  } else {
    mouse.x *= 2;
  }
}

function updateTileOwner(tile, owner) {
  tiles[tile].owner = owner;
}

function changeTileLetter(tile, letter) {
  tiles[tile].letterResources.letterContext.clearRect ( 0,0, tiles[tile].letterResources.canvasWidth, tiles[tile].letterResources.canvasHeight);
  tiles[tile].letterResources.letterContext.fillText(letter||'0', 100, 130);
  tiles[tile].letterResources.letterTexture.needsUpdate = true;
  tiles[tile].letter = letter;
}

function colorTile(tile, color) {
  if (!color) {
    if (tiles[tile].owner) {
      color = players[tiles[tile].owner].color;
    } else {
      color = {r:1,g:1,b:1};
    }
  }
  var faces = tiles[tile].faces;
  for (var i in faces) {
    faces[i].color.setRGB(color.r,color.g,color.b);
  }
  tiles[tile].geometry.colorsNeedUpdate = true;
}

var mousePosition;
var particleSystems = [];
var particleSettings = {
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
  if (event.button == 2) {
    return;
  }
  var vectorX = (event.clientX / window.innerWidth) * 2 - 1;
  var vectorY = -(event.clientY / window.innerHeight) * 2 + 1;
  var vectorZ = 0.5;
  var vector = new THREE.Vector3(vectorX, vectorY, vectorZ);

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
        particle.originalX *= particleSettings.sizeMultiplier;
        particle.originalY *= particleSettings.sizeMultiplier;
      }
    }
  }
}

function gatherParticles(event) {
  for(var ps = 0; ps < particleSystems.length; ps++) {
    for(var p = 0; p < particleSystems[ps].geometry.vertices.length; p++) {
      var particle = particleSystems[ps].geometry.vertices[p];

      if(particle.spread) {
        particle.originalX *= 1 / particleSettings.sizeMultiplier;
        particle.originalY *= 1 / particleSettings.sizeMultiplier;
      }
    }
  }
}

function createParticleSystems() {
  mousePosition = camera.position;

  /* WORPHLE DRAWING */
  for(var ps = 0; ps < particleSettings.systemCount; ps++) {
    var particles = new THREE.Geometry();
    var pMaterial = new THREE.ParticleBasicMaterial({
      color: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
      size: 0.02*WS/2
    });

    /* Worphle Coordinates */
    var xStartCoordinates = [-.1825, .1825, .1825, .12, -.1825, -.12, -.1825, .1825, -.13, -.1825, -.13, .1825, .24, .15, .15, .01, .01, .06];
    var yStartCoordinates = [-.1825, -.1825, .1825, .28, .1825, .28, -.1825, -.1825, -.13, 0, -.02, .02, .01, .16, .145, .16, .145, .06];
    var xTargetCoordinates = [-.1825, .1825, .12, 0, -.12, 0, -.13, .13, .13, -.13, -.13, .24, .1825, .165, .165, .025, .025, .10];
    var yTargetCoordinates = [.1825, .1825, .28, .335, .28, .335, -.13, -.13, -.13, -.02, .02, .01, .09, .145, .16, .145, .16, .06];

    for(var i = 0; i < xStartCoordinates.length; i++) {
      createWorphleParticles(xStartCoordinates[i]*WS, yStartCoordinates[i]*WS, xTargetCoordinates[i]*WS, yTargetCoordinates[i]*WS, particles);
    }

    particleSystem = new THREE.ParticleSystem(particles, pMaterial);
    particleSystem.position.set(0, 0, 0);
    scene.add(particleSystem);
    particleSystems.push(particleSystem);
  }

  /* STARS */
  var particles = new THREE.Geometry;
  var pMaterial = new THREE.ParticleBasicMaterial({
    color: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
    size: 0.3*SCALE,
    map: THREE.ImageUtils.loadTexture(
      "client/resources/starImages/star-white.png"
    ),
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  createStarParticles(particles);

  var starSystem = new THREE.ParticleSystem(particles, pMaterial);
  starSystem.position.set(0, 0, 0);
  scene.add(starSystem);
  particleSystems.push(starSystem);

  $('#graphics').mousedown(function() {
    spreadParticles();
  });
  $('#graphics').mouseup(function() {
    gatherParticles();
  });
  
  renderParticles();
}

function createWorphleParticles(xStart, yStart, xTarget, yTarget, particles) {
  var xIncrement = (xTarget - xStart) / particleSettings.particleCount;
  var yIncrement = (yTarget - yStart) / particleSettings.particleCount;

  for(var p = 1; p < particleSettings.particleCount; p++) {
    var blurFactor = ((Math.random() * particleSettings.pictureBlur) - particleSettings.pictureBlur)*WS;
    var pX = xStart + xIncrement * p + blurFactor;
    var pY = yStart + yIncrement * p + blurFactor;
    var pZ = ((Math.random() * .02) + .02)*1000;
    var particle = new THREE.Vector3(pX, pY, pZ);
    particle.speed = (Math.random() * particleSettings.averageParticleSpeed) + (particleSettings.averageParticleSpeed / 3);
    particle.originalX = pX;
    particle.originalY = pY;
    particle.spread = true;
    particles.vertices.push(particle);
  }
}

function createStarParticles(particles) {
  for(var s = 0; s < particleSettings.starCount; s++) {
    var pX = SCALE*((Math.random() * 80) - 40);
    var pY = SCALE*((Math.random() * 80) - 40);
    var pZ = SCALE*((Math.random() * 80) - 40);
    var particle = new THREE.Vector3(pX, pY, pZ)
    particle.speed = (Math.random() * 0.6) + .03;
    particle.originalX = pX;
    particle.originalY = pY;
    particle.spread = false;
    particles.vertices.push(particle);
  }
}
