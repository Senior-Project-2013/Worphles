var letterGenerator = require('./letter_generator');
var cubeGrid = require('./cube_grid').getGrid();

// all time is in milliseconds
var SECOND = 1000;
var MINUTE = SECOND * 60;
var DEFAULT_ROUND_TIME = 240 * SECOND;
var DEFAULT_MAX_PLAYERS = 6;
var DEFAULT_GRID_SIZE = 4;
var COLORS = {
  RED: new Color(1,0,0),
  BLUE: new Color(0,0,1),
  GREEN: new Color(0,1,0),
  YELLOW: new Color(1,1,0),
  MAGENTA: new Color(1,0,1),
  CYAN: new Color(0,1,1),
}
function Color(r,g,b) {
  this.r = r;
  this.g = g;
  this.b = b;
}
var playerColorOptions = [COLORS.RED,COLORS.BLUE,COLORS.GREEN,COLORS.YELLOW,COLORS.MAGENTA,COLORS.CYAN];

function Player(socket, color) {
  this.socket = socket;
  this.color = color;
  this.name = null;
  this.id = null;
  this.score = 0;
};

Player.randomColor = function(i) {
  return playerColorOptions[i];
};

/**
 * Create a new tile 
 */
function Tile(letter) {
  this.letter = letter;
  this.owner = null;
  this.strength = null; //not needed yet
  
  /**
   * Randomize this tile's letter.
   */
  this.randomize = function() {
    this.letter = Tile.randomLetter();
  };
};


/**
 * Returns a random letter.
 */
Tile.randomLetter = function() {
  return letterGenerator.getLetter();
};


/**
 * Game Settings 
 */
function Settings(roundTime, maxPlayers, gridSize) {
  this.roundTime = roundTime || DEFAULT_ROUND_TIME;
  this.maxPlayers = maxPlayers || DEFAULT_MAX_PLAYERS;
  this.gridSize = gridSize || DEFAULT_GRID_SIZE;
};


/**
 * Instance of a Game
 */
function Game(inputPlayers, settings) {
  this.settings = settings || new Settings();

  this.players = {};
  for (var i = 0; i < this.settings.maxPlayers && i < inputPlayers.length; i++) {
    console.log('newplayer',inputPlayers[i].socket.id);
    this.players[inputPlayers[i].socket.id] = new Player(inputPlayers[i].socket.id, Player.randomColor(i));
  }

  this.tiles = [];
  for (var i = 0; i < this.settings.gridSize * this.settings.gridSize * 6; i++) {
    this.tiles.push(new Tile(Tile.randomLetter()));
  }

  this.getNewLetters = function(tiles) {
    var newTiles = {};
    for (var i = 0; i < tiles.length; i++) {
      newTiles[tiles[i]] = Tile.randomLetter();
    }
    return newTiles;
  }
};


/**
 * Public game constructor
 */
module.exports.newGame = function(players, settings) {
  return new Game(players, settings);
};


/**
 * Default Game Settings
 */
module.exports.defaultSettings = function() {
  return new Settings();
};
