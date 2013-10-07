/*
  Adapted from Three.js "tutorials by example"
  (Original Author: Lee Stemkoski
  Date: July 2013 (three.js v59dev))


  By: Senior Project Worphle Group
  - Caleb Gomer
  - Jeremy Dye
  - Alex Chau
  - Erik Kremer
  - Jordon Biondo

  Date: September-December 2013
*/

// the web socket where all the magic happens
var scoreboard = new Scoreboard();
var socket;
var container;
var scene;
var camera;
var renderer;
var controls;
var stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
// the Worphle World Cube
var cube;
// the list of 'hittable' objects for raycasting - currently just tile hitboxes
var targetList = [];
var projector;
var mouse = { x: 0, y: 0 ,lClicked: false, rClicked: false};
var INTERSECTED;
var TILES;
// current game's id
var gameId;
// current player's id
var me;
// all players in this game
var players;

// a place to put the currently selected tiles
var currentTiles = [];
// the last selected tile
var lastTile;

// constants
var X_AXIS = new THREE.Vector3(1,0,0);
var Y_AXIS = new THREE.Vector3(0,1,0);
var Z_AXIS = new THREE.Vector3(0,0,1);
var NINETY_DEG = 90*Math.PI/180;

var ABSOLUTE_FAIL = 'Sorry, your browser does not support WebGL...\nYou won\'t be able to play this game :(';

// startup
$(function() {
  // only start the game if the browser/graphics card support WebGL
  if (Detector.webgl) {
    setupButtons();
    setupWebSockets();
  } else {
    alert(ABSOLUTE_FAIL);
  }
});

/**
  Start up the game
*/     
function init(game)  {
  // save game id
  gameId = game.id;
  // players
  me = socket.socket.sessionid;
  players = game.players;

  // scene
  scene = new THREE.Scene();

  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight; 
  var VIEW_ANGLE = 45;
  var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
  var NEAR = 0.1;
  var FAR = 20000;

  // camera
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0,150,400);
  camera.lookAt(scene.position);  

  // renderer and container
  renderer = new THREE.WebGLRenderer( {antialias:true} );
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container = document.getElementById( 'ThreeJS' );
  container.appendChild( renderer.domElement );

  // automatically resize renderer
  THREEx.WindowResize(renderer, camera);
  // toggle full-screen on given key press
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

  // set up mouse controls
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  
  // some stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild( stats.domElement );
  
  // create a light
  var light = new THREE.PointLight(0xffffff);
  light.position.set(0,250,0);
  scene.add(light);
  var ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);
  
  // the cube magic
  var settings = game.settings;
  // graphics settings
  var cubeSize = 80;
  var tilesPerRow = settings.gridSize;
  var tileSize = cubeSize / tilesPerRow;
  var gSettings = new TileGraphicsSettings(tilesPerRow, tileSize);

  TILES = new Array(gSettings.tilesPerSide*6);

  // new tiles stuffs!
  for (var side = 0; side < 6; side++) {
    // console.log('side',side);
    for (var row = 0; row < gSettings.tilesPerRow; row++) {
      // console.log('row',row);
      for (var col = 0; col < gSettings.tilesPerRow; col++) {
        var tileNum = side*gSettings.tilesPerSide + row*gSettings.tilesPerRow + col;
        // console.log(tileNum);
        var _side = side;
        var _axis = Y_AXIS;
        if (side == 4) {
          _side = 1;
          _axis = X_AXIS;
        } else if (side == 5) {
          _side = -1;
          _axis = X_AXIS;
        }
        makeTile(_side, _axis, col, row, tileNum, game.tiles[tileNum].letter, gSettings);
      }
    }
  }
  
  // foggy
  scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
  
  // initialize object to perform world/screen calculations
  projector = new THREE.Projector();
  
  document.addEventListener( 'mousedown', mouseDown, false );
  document.addEventListener( 'mousemove', mouseMove, false );
}

function TileGraphicsSettings(tilesPerRow, tileSize) {
  this.tilesPerRow = tilesPerRow,
  this.tilesPerSide = tilesPerRow*tilesPerRow,
  this.tileSize = tileSize,
  this.tilePadding = tileSize*0.25,
  this.hitBoxSize = tileSize*0.75,
  this.hitBoxStart = 0.5*tileSize*(tilesPerRow%2+1*((tilesPerRow%2)?-1:1)) + Math.floor((tilesPerRow-0.5)/2)*tileSize

  var cubeGeometry = new THREE.CubeGeometry(79.9, 79.9, 79.9, 4, 4, 4);

  var cubeTexture = new THREE.ImageUtils.loadTexture('webui/images/tile.png');
  cubeTexture.wrapS = cubeTexture.wrapT = THREE.RepeatWrapping;
  cubeTexture.repeat.set(this.tilesPerRow, this.tilesPerRow);
  var cubeMaterial = new THREE.MeshBasicMaterial({map:cubeTexture});
  var cube = new THREE.Mesh(cubeGeometry.clone(), cubeMaterial);
  cube.position.set(0, 0, 0);
  scene.add(cube);    

  var floorTexture = new THREE.ImageUtils.loadTexture( 'webui/images/tile.png' );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  floorTexture.repeat.set( 1, 1 );
  this.tileMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
  this.floorGeometry = new THREE.PlaneGeometry(this.hitBoxSize,this.hitBoxSize);
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
  TILES[num] = thisTile;
}

function mouseMove(event)  {
  updateMouse(event);
}

function mouseDown(event)  {
  if (event.button == 1) {
    return;
  } if (event.button == 2) {
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
  } if (event.button == 2) {
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
}

function updateMouse(event) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function setupButtons() {
  $('#joinQueue').text('Join Queue');
  $('#customGame').text('Custom Game');

  $('#joinQueue').click(function() {
    hideButtons();
    $('#queuePopup').fadeIn();
    socket.emit('joinQueue');
    console.log('joinQueue');
  });
  $('#customGame').click(function() {
    $('#customGame').text('jk ;)');
  });
}

function hideButtons() {
  $('#customGame').fadeOut();
  $('#joinQueue').fadeOut();
}

function showButtons() {
  $('#customGame').fadeIn();
  $('#joinQueue').fadeIn(); 
}

function setupWebSockets() {
  socket = io.connect(WEBSOCKETS_URL);
  socket.on('full', function(data) {
    $('#queue').text('Sorry, server\'s full');
  });

  socket.on('start', function(game) {
    //console.log(game.players)

    //add scoreboard
    scoreboard.init(game.players);

    $('#sidebar').fadeIn();
    $('#queuePopup').fadeOut();
    // initialization
    init(game);
    // animation loop / game loop
    animate();
  });

  socket.on('queue', function(data) {
    if (data.almostReady) {
      $('#queue').text('Starting...');
    } else {
      var queueText = '';
      for (var i = 0; i < data.currentPlayers; i++) {
        queueText+='1.';
      }
      for (var i = data.currentPlayers; i < data.neededPlayers; i++) {
        queueText+='0';
        if (i+1 != data.neededPlayers) {
          queueText+='.';
        }
      }
      $('#queue').text(queueText);
      console.log('have',data.currentPlayers,'need',data.neededPlayers);
    }
  });

  socket.on('stillhere?', function(data, callback) {
    callback();
  });

  socket.on('successfulMove', function(data) {
    console.log('successfulMove',data);
    for (var i in data) {
      updateTile(i, data[i].letter, data[i].owner);
    }
  });

  socket.on('unsuccessfulMove', function(data) {
    console.log('unsuccessfulMove',data);
    for (var i in data) {
      colorTile(data[i]);
    }
  });

  socket.on('partialMove', function(data) {
    colorTile(data.tile, players[data.player].color);
  });

  socket.on('scoreboardUpdate', function(data) {
    for(var i = 0; i < Object.keys(data).length; i++) {
      var playerId = Object.keys(data)[i];
      scoreboard.updateScoreDisplay(playerId, data[playerId]);
    } 
  })
};

function animate() {
  requestAnimationFrame(animate);
  render();   
  update();
}

function update() {
  // delta = change in time since last call (in seconds)
  var delta = clock.getDelta(); 

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
      lastTile = tile;
    }
  }
    
  controls.update();
  stats.update();
}

function updateTile(tile, letter, owner) {
  updateTileOwner(tile, owner);
  colorTile(tile, players[owner].color);
  changeTileLetter(tile, letter);
}

function updateTileOwner(tile, owner) {
  TILES[tile].owner = owner;
}

function changeTileLetter(tile, letter) {
  TILES[tile].letterResources.letterContext.clearRect ( 0,0, TILES[tile].letterResources.canvasWidth, TILES[tile].letterResources.canvasHeight);
  TILES[tile].letterResources.letterContext.fillText(letter||'0', 100, 130);
  TILES[tile].letterResources.letterTexture.needsUpdate = true;
}

function colorTile(tile, color) {
  if (!color) {
    if (TILES[tile].owner) {
      color = players[TILES[tile].owner].color;
    } else {
      color = {r:1,g:1,b:1};
    }
  }
  var faces = TILES[tile].faces;
  for (var i in faces) {
    console.log('coloring tile',tile,color,i);
    faces[i].color.setRGB(color.r,color.g,color.b);
  }
  TILES[tile].geometry.colorsNeedUpdate = true;
}

function render() { 
  renderer.render( scene, camera );
}
