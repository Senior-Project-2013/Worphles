/*
  By: Senior Project Worphle Group
  - Caleb Gomer
  - Jeremy Dye
  - Alex Chau
  - Erik Kremer
  - Jordon Biondo

  Date: September-December 2013
*/

// the web socket where all the magic happens
var playerName;
var scoreboard = new Scoreboard();
var socket;
var container;
var scene;
var camera;
var renderer;
var controls;
// var stats;
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
// timer
var startTime;
var intervalId;

// star field
var starSystems;
var starSettings = {
  starCount: 500, //the number of background particles
  averageParticleSpeed: .3, //lower for faster
};

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
    setupWebSockets();
    setupUI();
    // init the graphics, start animations
    initGraphics();
    animate();
  } else {
    alert(ABSOLUTE_FAIL);
  }
});

/**
  Start up the game
*/
function initGame(game) {
  $('#lobbyButtons').fadeOut();
  $('#startGameButton').fadeOut();
  $('#currentWord').fadeIn();
  $('#chatInput').fadeIn();
  $('#scoreboard').fadeIn();

  // save game id
  gameId = game.id;
  // players
  me = socket.socket.sessionid;
  players = game.players;
  // scoreboard
  scoreboard.init(game.players);
  startTimer(game.startTime, game.roundTime);
  addCube(game.settings, game.tiles);
}

/**
  Start up the graphics
*/     
function initGraphics()  {
  // scene
  scene = new THREE.Scene();

  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight; 
  var VIEW_ANGLE = 45;
  var ASPECT = (SCREEN_WIDTH/2) / SCREEN_HEIGHT;
  var NEAR = 0.1;
  var FAR = 20000;

  // camera
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0,150,400);
  camera.lookAt(scene.position);  

  // renderer and container
  renderer = new THREE.WebGLRenderer( {antialias:true} );
  renderer.setSize(SCREEN_WIDTH/2, SCREEN_HEIGHT);
  container = document.getElementById('graphics');
  container.appendChild( renderer.domElement );

  // automatically resize renderer
  THREEx.WindowResize(renderer, camera);

  // set up mouse controls
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  
  // some stats
  // stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.bottom = '0px';
  // stats.domElement.style.zIndex = 100;
  // container.appendChild( stats.domElement );
  
  // create a light
  var light = new THREE.PointLight(0xffffff);
  light.position.set(0,250,0);
  scene.add(light);
  var ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);

  createParticleSystems(scene, camera);
  
  // initialize object to perform world/screen calculations
  projector = new THREE.Projector();

  document.addEventListener( 'mousedown', mouseDown, false );
  document.addEventListener( 'mousemove', mouseMove, false );
}

function addCube(settings, tiles) {
  // the cube magic
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
        makeTile(_side, _axis, col, row, tileNum, tiles[tileNum].letter, gSettings);
      }
    }
  }
}

function TileGraphicsSettings(tilesPerRow, tileSize) {
  this.tilesPerRow = tilesPerRow,
  this.tilesPerSide = tilesPerRow*tilesPerRow,
  this.tileSize = tileSize,
  this.tilePadding = tileSize*0.25,
  this.hitBoxSize = tileSize*0.75,
  this.hitBoxStart = 0.5*tileSize*(tilesPerRow%2+1*((tilesPerRow%2)?-1:1)) + Math.floor((tilesPerRow-0.5)/2)*tileSize

  var cubeGeometry = new THREE.CubeGeometry(79.9, 79.9, 79.9, 4, 4, 4);

  var cubeTexture = new THREE.ImageUtils.loadTexture('client/images/tile.png');
  cubeTexture.wrapS = cubeTexture.wrapT = THREE.RepeatWrapping;
  cubeTexture.repeat.set(this.tilesPerRow, this.tilesPerRow);
  var cubeMaterial = new THREE.MeshBasicMaterial({map:cubeTexture});
  var cube = new THREE.Mesh(cubeGeometry.clone(), cubeMaterial);
  cube.position.set(0, 0, 0);
  scene.add(cube);    

  var floorTexture = new THREE.ImageUtils.loadTexture( 'client/images/tile.png' );
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

function joinGame(id, hasPassword) {
  if (!id) {
    return;
  }
  var password = '';
  if (hasPassword) {
    password = prompt('Enter Password');
  }
  socket.emit('joinGame', {id: id, password: password});
}

function setupUI() {
  var nameButton = $('#nameButton');
  var nameInput = $('#nameInput');
  nameInput.keyup(function() {
    if(nameInput.val().length < 3) {
      nameButton.attr('disabled', 'disabled');
    } else {
      nameButton.removeAttr('disabled');
    }
  });
  $('#nameButton').click(chooseName);

  var createGameButton = $('#createGameButton');
  var gameNameInput = $('#gameNameInput');
  var gamePasswordInput = $('#gamePasswordInput');
  var gameBoardSizeInput = $('#gameBoardSizeInput');
  var gameNumPlayersInput = $('#gameNumPlayersInput');
  var gameLengthInput = $('#gameLengthInput');
  gameNameInput.keyup(function() {
    if (gameNameInput.val().length >= 3) {
      createGameButton.removeAttr('disabled');
    } else {
      createGameButton.attr('disabled', 'disabled');
    }
  });
  $('#createGameButton').click(createGame);

  $('#joinGameModalShow').click(function() {
    socket.emit('gameList');
  });

  $('#startGameButton').click(function() {
    socket.emit('startGame');
  });

  $('#createLobby').click(function() {
    if ($('#createLobby').text() === 'Start') {
      return socket.emit('startGame');
    }

    var gInput;
    while(!(gInput && gInput.length == 5)) {
      gInput = prompt('name:password:size:maxPlayers:time').split(':');
    }
    socket.emit('createGame', {name: gInput[0], password: gInput[1], size: gInput[2], maxPlayers: gInput[3], time: gInput[4]});
  });

  $('#refresh').click(function() {
    socket.emit('gameList');
  });
}

function showButtons() {
  $('#customGame').fadeIn();
  $('#joinQueue').fadeIn(); 
}

function chooseName() {
  var name = $('#nameInput').val();
  if (name && name.length >= 3) {
    socket.emit('name', name);
    $('#nameInput').val('');
    $('#nameButton').attr('disabled', 'disabled');
  }
  // stops the form from submitting if being called from HTML form
  return false;
}

function createGame() {
  var gameNameInput = $('#gameNameInput');
  var gamePasswordInput = $('#gamePasswordInput');
  var gameBoardSizeInput = $('#gameBoardSizeInput');
  var gameNumPlayersInput = $('#gameNumPlayersInput');
  var gameLengthInput = $('#gameLengthInput');

  var name = gameNameInput.val();
  var password = gamePasswordInput.val();
  var size = gameBoardSizeInput.val();
  var players = gameNumPlayersInput.val();
  var length = gameNumPlayersInput.val();

  if (name && size && players && length) {
    var newGame = {name: name, password: password, size: size, maxPlayers: players, time: length};
    console.log(newGame);
    socket.emit('createGame', newGame);
  }
  // stops the form from submitting if being called from HTML form
  return false;
}

function sendChat(chat) {
  if (chat) {
    socket.emit('chat', {game:gameId, message:chat});
  } else if (chat === undefined) {
    chat = $('#chatInput').val();
    if (chat) {
      socket.emit('chat', {game:gameId, message:chat});
    }
  }
  $('#chatInput').val('');
  // stops the form from submitting if being called from HTML form
  return false;
}

function showChat(player, message) {
  console.log('show chat',player,message);
  $('#messages').append('<div class="chatRow" style='+getCSSColorFromColor(players[player].color)+'>'+players[player].name+': '+message+'</div>');
}

function getCSSColorFromColor(color) {
  return getCSSColorFromRGB(color.r, color.g, color.b);
}

function getCSSColorFromRGB(r, g, b) {
  return 'background-color:rgb('+(r*255)+','+(g*255)+','+(b*255)+')';
}

function showGameList(data) {
  var games = [];
  for (var i = 0; i < data.length; i++) {
    games.push({id: data[i].id, name: data[i].name, currentPlayers: data[i].currentPlayers, maxPlayers: data[i].maxPlayers, gridSize: data[i].gridSize, password: data[i].password});
  }
  if (games.length) {
    var gameListDiv = $('#gameList').empty();
    for (var i = 0; i < games.length; i++) {
      var game = games[i];
      $('<li/>', {
        id: 'join'+game.id,
        class: 'gameListRow'
      }).appendTo(gameListDiv);

      var thisGame = $('#join'+game.id);

      $('<button/>',{
        text: 'Join',
        class: 'btn btn-primary',
        onclick: 'joinGame(\''+game.id+'\', '+game.password+');'
      }).appendTo(thisGame);

      $('<span/>', {
        text: ' '+game.name,
        class: 'gameName',
      }).appendTo(thisGame);

      $('<span/>', {
        text: ' ---- '+(game.currentPlayers + '/'+game.maxPlayers + ' Players'),
        class: 'gamePlayers',
      }).appendTo(thisGame);

      $('<span/>', {
        text: ' ---- '+game.gridSize +'x'+game.gridSize,
        class: 'gameGridSize',
      }).appendTo(thisGame);
    }
    $('#joinGameModal').modal('show');
  } else {
    alert('Sorry, there are no games. Please create one.');
  }
}

function setupWebSockets() {
  socket = io.connect();
  socket.on('full', function(data) {
    $('#queue').text('Sorry, server\'s full');
  });

  socket.on('hi', function(data) {
    $('#startingButtons').fadeOut(function() {
      $('#lobbyButtons').fadeIn();
    });
  });
  
  socket.on('nameFail', function(data) {
    $('#nameForm').fadeIn();
  });

  socket.on('gameCreated', function(data) {
    gameId = data && data.id;
    $('#createGameModal').modal('hide');
    $('#lobbyButtons').fadeOut();
    $('#startGameButton').fadeIn();
    $('#chatBar').fadeIn();
  });

  socket.on('startFail', function(data) {
    alert('can\'t start because '+data.message);
  });

  socket.on('gameList', showGameList);

  socket.on('joinedGame', function(data) {
    gameId = data && data.id;
    $('#joinGameModal').modal('hide');
    $('#lobbyButtons').fadeOut();
    $('#chatBar').fadeIn();
  });

  socket.on('deniedGame', function(data) {
    alert("Couldn't Join");
  });

  socket.on('players', function(thePlayers) {
    me = socket.socket.sessionid;
    players = thePlayers;
  });

  socket.on('start', function(game) {
    initGame(game);
  });

  socket.on('gameOver', function(data) {
    //wat do
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


  socket.on('chat', function(data) {
    console.log('got chat');
    showChat(data.player, data.message);
  });

  socket.on('scoreboardUpdate', function(data) {
    for(var i = 0; i < Object.keys(data).length; i++) {
      console.log(data);
      var playerId = Object.keys(data)[i];
      players[playerId].score = data[playerId].score;
      scoreboard.updateScoreDisplay(playerId, data[playerId]);
    }
  });
};

function animate() {
  requestAnimationFrame(animate);
  renderParticles();
  render();
  update();
}

function update() {
  // delta = change in time since last call (in seconds)
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
  // stats.update();
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
  TILES[tile].letter = letter;
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
    // console.log('coloring tile',tile,color,i);
    faces[i].color.setRGB(color.r,color.g,color.b);
  }
  TILES[tile].geometry.colorsNeedUpdate = true;
}

function render() { 
  renderer.render( scene, camera );
}

function updateWordDisplay(tileNums) {
  var word = '';

  for(var i = 0; i < tileNums.length; i++) {
    word += TILES[tileNums[i]].letter;
  }

  $('#currentWord').text(word);
}

$(document).ready(function() {
  var playButton = $('#playButton');

  playButton.attr('disabled', true);
  playButton.css('opacity', 0.5);

  

  $('#playButton').click(function() {
    playerName = $('#nameInput').val();
    socket.emit('name', playerName);

    $('#greeting').text('Welcome, ' + playerName + '!');

    $('#askName').fadeOut();
    $('#startingButtons').fadeIn();
  })

  $('#showLobbies').click(function() {
    hideContentDivs();
    $('#mainLobbyContainer').fadeIn();
  });
});

function hideContentDivs() {
  $('#mainLobbyContainer').attr('display', 'none');
  $('#storyBookContainer').attr('display', 'none');
}

function startTimer(startTime, roundTime) {
  //show the timer
  intervalId = setInterval(function () {
    currentTime = new Date();
    if ((currentTime - startTime) >= roundTime) {
      stopTimer();
    } else {
      //update the timer
      console.log("IT IS ALIVEEEEEEE");
    }
  }, 1000);
}

function stopTimer() {
  //hide the timer
  clearInterval(intervalId);
}
