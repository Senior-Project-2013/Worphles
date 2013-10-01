var gm = require('./geometry.js');
var assert = require('assert');


var DIRECTIONS = {
  right:  new gm.Point(1, 0),
  upRight:  new gm.Point(1, 1),
  up:  new gm.Point(0, 1),
  upLeft:  new gm.Point(-1, 1),
  left:  new gm.Point(-1, 0),
  downLeft:  new gm.Point(-1, -1),
  down:  new gm.Point(0, -1),
  downRight:  new gm.Point(1, -1)
};

var Tile = function(side, point) {
  return {
    side: side,
    pos: point
  };
}

var SideRelation = function(side, rotations) {
  return {
    side: side,
    rotations: rotations
  };
};

/**
 * Sides
 */
var Sides =  [
  {
    left: new SideRelation(3, 0),
    right: new SideRelation(1, 0),
    top: new SideRelation(5, 0),
    bottom: new SideRelation(4, 0)
  },{
    left: new SideRelation(0, 0),
    right: new SideRelation(2, 0),
    top: new SideRelation(5, 1),
    bottom: new SideRelation(4, 3)
  },{
    left: new SideRelation(1, 0),
    right: new SideRelation(3, 0),
    top: new SideRelation(5, 2),
    bottom: new SideRelation(4, 2)
  },{
    left: new SideRelation(2, 0),
    right: new SideRelation(0, 0),
    top: new SideRelation(5, 3),
    bottom: new SideRelation(4, 1)
  },{
    left: new SideRelation(3, 3),
    right: new SideRelation(1, 1),
    top: new SideRelation(0, 0),
    bottom: new SideRelation(2, 2)
  },{
    left: new SideRelation(3, 1),
    right: new SideRelation(1, 3),
    top: new SideRelation(2, 2),
    bottom: new SideRelation(0, 0)
  }];


/**
 * Apply the edge tranformation
 */
function applyTransform(point, rotations, n) {
  rotations = rotations % 4;
  for(var i = 0; i < rotations; i++) {
    var x = point.x;
    point.x = point.y;
    point.y = x;
    point.x = (n-1) - point.x;
  }
  return point;
}

/**
 * The game board
 */
var CubeGrid = function(size) {

  var grid = [];
  for (var i = 0; i < size * size * 6; i++) {
    grid[i] = indexToTile(i, size);
  }

  return {
    grid: grid,
    size: size,
    sides: Sides,
    getTile: function(index) {
      return this.grid[index];
    },
    nextTile: function(index, direction) {
      var thisTile = this.getTile(index);
      var corner = this.tileCorner(index);
      
      if (corner != null && direction == corner) return null;

      var nextTile = Tile(thisTile.side, thisTile.pos);
      var thisSide = this.sides[nextTile.side];
      nextTile.pos = nextTile.pos.add(direction);
      if (nextTile.pos.y == size) {
	nextTile.pos.y = 0;
	nextTile.side = thisSide.top.side;
	nextTile.pos = applyTransform(nextTile.pos, thisSide.top.rotations, size);
      } else if (nextTile.pos.y == -1) {
	nextTile.pos.y = size -1;
	nextTile.side = thisSide.botom.side;
	nextTile.pos = applyTransform(nextTile.pos, thisSide.bottome.rotations, size);
      } else if (nextTile.pos.x == size) {
	nextTile.pos.x = 0;
	nextTile.side = thisSide.right.side;
	nextTile.pos = applyTransform(nextTile.pos, thisSide.right.rotations, size);
      } else if (nextTile.pos.x == -1) {
	nextTile.pos.x = size -1;
	nextTile.side = thisSide.left.side;
	nextTile.pos = applyTransform(nextTile.pos, thisSide.left.rotations, size);
      }
      return nextTile;
    },
    
    tileIndex: function(tile) {
      return (tile.side * (size * size)) + (tile.pos.y * size) + tile.pos.x;
    },
    
    tileCorner: function(index) {
      var sizeSqr = this.size*this.size;
      var t = index - (sizeSqr * Math.floor(index / sizeSqr));
      if (t == 0) return DIRECTIONS.downLeft;
      else if (t == this.size-1) return DIRECTIONS.downRight;
      else if (t == sizeSqr - this.size) return DIRECTIONS.upLeft;
      else if (t == sizeSqr - 1) return DIRECTIONS.upRight;
      else return null;
    }
  };
};




/**
 * Initialize a Tile based on an index on a sized CubeGrid 
 */
function indexToTile(index, size) {
  assert(index >=0 && index < size*size*6);
  var side = Math.floor(index / (size * size));
  var sideIndex = index - side * (size * size);
  return Tile(side, new gm.Point(sideIndex % size, Math.floor(sideIndex / size)));
}
