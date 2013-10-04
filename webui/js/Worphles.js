/*
  Three.js "tutorials by example"
  Author: Lee Stemkoski
  Date: July 2013 (three.js v59dev)
 */

  
//////////  
// MAIN //
//////////

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var cube;
var targetList = [];
var projector, mouse = { x: 0, y: 0 , clicked: false}, INTERSECTED;
var me;
var players;

///////////////
// FUNCTIONS //
///////////////     
function init(game)  {
  me = socket.socket.sessionid;
  players = game.players;
  // console.log(socket.socket.sessionid);
  // for (var i in game.players) {
  //   if (i == socket.socket.sessionid) {

  //     me.color = game.players[i].color;
  //   }
  //   console.log(i);
  //   // if (game.players[i].socket == socket.socket.sessionid) {
  //   //   me.color = game.players[i].color;
  //   // }
  // }

  ///////////
  // SCENE //
  ///////////
  scene = new THREE.Scene();

  ////////////
  // CAMERA //
  ////////////
  
  // set the view size in pixels (custom or according to window size)
  // var SCREEN_WIDTH = 400, SCREEN_HEIGHT = 300;
  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight; 
  // camera attributes
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  // set up camera
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  // add the camera to the scene
  scene.add(camera);
  // the camera defaults to position (0,0,0)
  //  so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
  camera.position.set(0,150,400);
  camera.lookAt(scene.position);  
  
  //////////////
  // RENDERER //
  //////////////
  
  // create and start the renderer; choose antialias setting.
  if ( Detector.webgl )
    renderer = new THREE.WebGLRenderer( {antialias:true} );
  else
    renderer = new THREE.CanvasRenderer(); 
  
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  
  // attach div element to variable to contain the renderer
  container = document.getElementById( 'ThreeJS' );
  // alternatively: to create the div at runtime, use:
  //   container = document.createElement( 'div' );
  //    document.body.appendChild( container );
  
  // attach renderer to the container div
  container.appendChild( renderer.domElement );
  
  ////////////
  // EVENTS //
  ////////////

  // automatically resize renderer
  THREEx.WindowResize(renderer, camera);
  // toggle full-screen on given key press
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
  
  //////////////
  // CONTROLS //
  //////////////

  // move mouse and: left   click to rotate, 
  //                 middle click to zoom, 
  //                 right  click to pan
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  
  ///////////
  // STATS //
  ///////////
  
  // displays current and past frames per second attained by scene
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild( stats.domElement );
  
  ///////////
  // LIGHT //
  ///////////
  
  // create a light
  var light = new THREE.PointLight(0xffffff);
  light.position.set(0,250,0);
  scene.add(light);
  var ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);
  
  //////////////
  // GEOMETRY //
  //////////////
  var settings = game.settings;
  var CUBE_SIZE = 80;
  var tilesPerRow = settings.gridSize;
  var tilesPerSide = Math.pow(tilesPerRow,2);
  var tileSize = CUBE_SIZE / tilesPerRow;
  var tilePadding = tileSize*0.25;
  var hitBoxSize = tileSize*0.75;
  var hitBoxStart = 0.5*tileSize*(tilesPerRow%2+1*((tilesPerRow%2)?-1:1)) + Math.floor((tilesPerRow-0.5)/2)*tileSize;
    
  var cubeGeometry = new THREE.CubeGeometry( 79.9, 79.9, 79.9, 4, 4, 4 );

  var cubeTexture = new THREE.ImageUtils.loadTexture('webui/images/tile.png');
  cubeTexture.wrapS = cubeTexture.wrapT = THREE.RepeatWrapping;
  cubeTexture.repeat.set(tilesPerRow,tilesPerRow);
  var cubeMaterial = new THREE.MeshBasicMaterial({map:cubeTexture});
  var cube = new THREE.Mesh(cubeGeometry.clone(), cubeMaterial);
  cube.position.set(0, 0, 0);
  scene.add( cube );    

  var floorTexture = new THREE.ImageUtils.loadTexture( 'webui/images/tile.png' );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  floorTexture.repeat.set( 1, 1 );
  var tileMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
  var floorGeometry = new THREE.PlaneGeometry(hitBoxSize,hitBoxSize);

  var X_AXIS = new THREE.Vector3(1,0,0);
  var Y_AXIS = new THREE.Vector3(0,1,0);
  var Z_AXIS = new THREE.Vector3(0,0,1);
  var NINETY_DEG = 90*Math.PI/180;
  TILES = new Array(tilesPerSide*6);

  function Tile(num, letter, letterCanvas, letterContext, letterTexture, letterMesh, color, geometry, material) {
    this.num = num;
    this.letter = letter;
    this.letterCanvas = letterCanvas;
    this.letterContext = letterContext;
    this.letterTexture = letterTexture;
    this.letterMesh = letterMesh;
    this.color = color;
    this.geometry = geometry;
    this.faces = geometry.faces;
    this.material = material;
    this.owner = null;
  }

  function makeTile(side, axis, x, y, num, letter) {
    var rotation_matrix = new THREE.Matrix4().makeRotationAxis(axis, NINETY_DEG*side );
    var thisGeometry = floorGeometry.clone();
    var thisMaterial = tileMaterial.clone();
    var tile = new THREE.Mesh(thisGeometry, thisMaterial);
    var tileCoordX = -hitBoxStart + tileSize*x;
    var tileCoordY = -hitBoxStart + tileSize*y;
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
      new THREE.PlaneGeometry(hitBoxSize, hitBoxSize),
      material
    );
    letterMesh.position.set(tileCoordX, tileCoordY, 41.01);
    letterMesh.position.applyMatrix4(rotation_matrix);
    letterMesh.rotateOnAxis( axis, NINETY_DEG*side);
    scene.add(letterMesh);

    var thisTile = new Tile(num, letter, canvas, context, texture, letterMesh, null, thisGeometry, thisMaterial);
    tile.__tile_data = thisTile;
    TILES[num] = thisTile;
  }

  // new tiles stuffs!
  for (var side = 0; side < 6; side++) {
    // console.log('side',side);
    for (var row = 0; row < tilesPerRow; row++) {
      // console.log('row',row);
      for (var col = 0; col < tilesPerRow; col++) {
        var tileNum = side*tilesPerSide + row*tilesPerRow + col;
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
        makeTile(_side, _axis, col, row, tileNum, game.tiles[tileNum].letter);
      }
    }
  }

  // create a set of coordinate axes to help orient user
  //    specify length in pixels in each direction
  var axes = new THREE.AxisHelper(100);
  scene.add( axes );
  
  /////////
  // SKY //
  /////////
  
  // recommend either a skybox or fog effect (can't use both at the same time) 
  // without one of these, the scene's background color is determined by webpage background

  // make sure the camera's "far" value is large enough so that it will render the skyBox!
  var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
  // BackSide: render faces from inside of the cube, instead of from outside (default).
  var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
  var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
  // scene.add(skyBox);
  
  // fog must be added to scene before first render
  scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );

  //////////////////////////////////////////////////////////////////////
  
  // initialize object to perform world/screen calculations
  projector = new THREE.Projector();
  
  // when the mouse moves, call the given function
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function onDocumentMouseMove( event )  {
  // update the mouse variable
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onDocumentMouseDown( event )  {
  if (event.button == 2) return;
  // the following line would stop any other event handler from firing
  // (such as the mouse's TrackballControls)
  // event.preventDefault();
  mouse.clicked = true;
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  
  // update the mouse variable
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  return;
  
  // find intersections

  // create a Ray with origin at the mouse position
  //   and direction into the scene (camera direction)
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );
  var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = ray.intersectObjects( targetList );
  
  // if there is one (or more) intersections
  if ( intersects.length > 0 )
  {
    // intersects[0].object.material.color.setHex( 0xff00ff );
    // intersects[0].object.geometry.colorsNeedUpdate = true;
  }
}

var socket = io.connect(WEBSOCKETS_URL);

socket.on('start', function(game) {
  console.log(game);
  // initialization
  init(game);
  // animation loop / game loop
  animate();
});

socket.on('queue', function(data) {
  console.log('have',data.currentPlayers,'need',data.neededPlayers);
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
  var tile = data.tile;
  var color = data.color;
  console.log(tile);
  var faces = TILES[tile].faces;
  console.log(TILES[tile]);
  for (var i in faces) {
    faces[i].color.setRGB(color.r,color.g,color.b);
  }
  TILES[tile].geometry.colorsNeedUpdate = true;
});

function onDocumentMouseUp( event ) {
  document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  mouse.clicked = false;
  if (wordTiles.length) {
    socket.emit('moveComplete', wordTiles);
  }
  wordTiles = [];
}

function animate() 
{
  requestAnimationFrame( animate );
  render();   
  update();
}

function update()
{
  // delta = change in time since last call (in seconds)
  var delta = clock.getDelta(); 

  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );
  var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = ray.intersectObjects( targetList );

  if ( intersects.length > 0) {
    var tile = intersects[0].object.__tile_data.num;
    if (mouse.clicked && tile != lastTile) {
      socket.emit('partialMove', {tile:tile, color:players[me].color});
      var faces = TILES[tile].faces;
      for (var i in faces) {
        faces[i].color.setRGB(players[me].color.r,players[me].color.g,players[me].color.b);
      }
      TILES[tile].geometry.colorsNeedUpdate = true;

      // intersects[0].object.material.color.setHex( 0xff00ff );
      console.log(tile);
      wordTiles.push(tile);
      console.log(wordTiles);
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
  TILES[tile].letterContext.clearRect ( 0,0, TILES[tile].letterCanvas.width, TILES[tile].letterCanvas.height);
  TILES[tile].letterContext.fillText(letter||'0', 100, 130);
  TILES[tile].letterTexture.needsUpdate = true;
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

var wordTiles = [];
var lastTile;

function render() 
{ 
  renderer.render( scene, camera );
}
