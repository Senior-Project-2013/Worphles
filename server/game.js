var letterGenerator = require('./letter_generator');
var cubeGrid = require('./cube_grid').getGrid();

// all time is in milliseconds
var SECOND = 1000;
var MINUTE = SECOND * 60;
var DEFAULT_ROUND_TIME = 240 * SECOND;
var DEFAULT_MAX_PLAYERS = 6;
var DEFAULT_GRID_SIZE = 4;
var playerColorOptions = ['red','blue','green','yellow','orange','magenta'];

function Player(socket, color) {
  this.socket = socket;
  this.color = color;
  this.name = null;
  this.id = null;
  this.score = 0;
};

Player.randomColor = function(i) {
  return playerColorOptions[i];
}

function Tile(letter) {
  this.letter = letter;
  this.owner = null;
  this.strength = null; //not needed yet
};

Tile.randomLetter = function() {
  return letterGenerator.getLetter();
};

function Settings(roundTime, maxPlayers, gridSize) {
  this.roundTime = roundTime || DEFAULT_ROUND_TIME;
  this.maxPlayers = maxPlayers || DEFAULT_MAX_PLAYERS;
  this.gridSize = gridSize || DEFAULT_GRID_SIZE;
};

function Game(inputPlayers, settings) {
  this.settings = settings || new Settings();

  this.players = [];
  for (var i = 0; i < this.settings.maxPlayers && i < inputPlayers.length; i++) {
    this.players.push(new Player(inputPlayers[i].socket.id, Player.randomColor(i)));
  }

  this.tiles = [];
  for (var i = 0; i < this.settings.gridSize * this.settings.gridSize * 6; i++) {
    this.tiles.push(new Tile(Tile.randomLetter()));
  }
};

module.exports.newGame = function(players, settings) {
  return new Game(players, settings);
}

module.exports.defaultSettings = function() {
  return new Settings();
}
