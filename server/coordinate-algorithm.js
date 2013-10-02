var geometry = require('./geometry.js');
var assert = require('assert');

/**
 * Faces of a cube
 */
var SIDES_PER_CUBE = 6;


/**
 * Possible Directions, held as vectors
 */
var DIRECTIONS = {
  right:	new geometry.Vector(1, 0),
  upRight:	new geometry.Vector(1, 1),
  up:		new geometry.Vector(0, 1),
  upLeft:	new geometry.Vector(-1, 1),
  left:		new geometry.Vector(-1, 0),
  downLeft:	new geometry.Vector(-1, -1),
  down:		new geometry.Vector(0, -1),
  downRight:	new geometry.Vector(1, -1)
};


/**
 * A Tile
 */
var Tile = function(side, point) {
  this.side = side;
  this.pos =  point;	
}

/**
 * Alternative constructor, initialize from index on a sized cube grid.
 */
Tile.fromIndex = function(index, size) {
  assert(index >= 0 && index < size * size * SIDES_PER_CUBE);
  var side = Math.floor(index / (size * size));
  var sideIndex = index - side * (size * size);
  return new Tile(side, new geometry.Vector(sideIndex % size, Math.floor(sideIndex / size)));
}


/**
 * Side Relation
 */
var SideRelation = function(side, rotations) {
  this.side =  side;
  this.rotations =  rotations;
};


/**
 * Sides
 */
var Sides =  [
  {
    left:	new SideRelation(3, 0),
    right:	new SideRelation(1, 0),
    top:	new SideRelation(5, 0),
    bottom:	new SideRelation(4, 0)
  },{
    left:	new SideRelation(0, 0),
    right:	new SideRelation(2, 0),
    top:	new SideRelation(5, 1),
    bottom:	new SideRelation(4, 3)
  },{
    left:	new SideRelation(1, 0),
    right:	new SideRelation(3, 0),
    top:	new SideRelation(5, 2),
    bottom:	new SideRelation(4, 2)
  },{
    left:	new SideRelation(2, 0),
    right:	new SideRelation(0, 0),
    top:	new SideRelation(5, 3),
    bottom:	new SideRelation(4, 1)
  },{
    left:	new SideRelation(3, 3),
    right:	new SideRelation(1, 1),
    top:	new SideRelation(0, 0),
    bottom:	new SideRelation(2, 2)
  },{
    left:	new SideRelation(3, 1),
    right:	new SideRelation(1, 3),
    top:	new SideRelation(2, 2),
    bottom:	new SideRelation(0, 0)
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
 * The Game Board
 */
var CubeGrid = function(size) {

  // init the grid
  var grid = [];
  for (var i = 0; i < size * size * SIDES_PER_CUBE; i++) grid[i] = Tile.fromIndex(i, size);

  
  /**
   * Array of tiles
   */
  this.grid =  grid;

  
  /**
   * Cube size
   */
  this.size =  size;

  
  /**
   * Array of sides
   */
  this.sides =  Sides;

  
  /**
   * Get tile at INDEX
   */
  this.getTile =  function(index) {
    return this.grid[index];
  };
  

  /**
   * Get the tile next to the tile at INDEX in the given DIRECTION
   */
  this.nextTile =  function(index, direction) {
    var thisTile = this.getTile(index);
    var corner = this.tileCorner(index);
    
    if (corner != null && direction == corner) return null;
    
    var nextTile = new Tile(thisTile.side, thisTile.pos);
    var thisSide = this.sides[nextTile.side];
    nextTile.pos = nextTile.pos.add(direction);
    if (nextTile.pos.y == size) {
      nextTile.pos.y = 0;
      nextTile.side = thisSide.top.side;
      nextTile.pos = applyTransform(nextTile.pos, thisSide.top.rotations, size);
    } else if (nextTile.pos.y == -1) {
      nextTile.pos.y = size -1;
      nextTile.side = thisSide.bottom.side;
      nextTile.pos = applyTransform(nextTile.pos, thisSide.bottom.rotations, size);
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
  };

  
  /**
   * Get a tile's index
   */
  this.tileIndex = function(tile) {
    return (tile.side * (size * size)) + (tile.pos.y * size) + tile.pos.x;
  };
  

  /**
   * Returns the corner that the tile at INDEX is on as a Direction,
   * if the tile is not on a corner, null is returned
   */
  this.tileCorner = function(index) {
    var sizeSqr = this.size*this.size;
    var t = index - (sizeSqr * Math.floor(index / sizeSqr));
    if (t == 0) return DIRECTIONS.downLeft;
    else if (t == this.size-1) return DIRECTIONS.downRight;
    else if (t == sizeSqr - this.size) return DIRECTIONS.upLeft;
    else if (t == sizeSqr - 1) return DIRECTIONS.upRight;
    else return null;
  };

  
  /**
   * Returns the neighboring tiles of tile at INDEX as an object.
   */
  this.tileNeighbors = function(index) {
    var result = {};
    var dir; // swanky!
    for (dir in DIRECTIONS) {
      var tile = this.nextTile(index, DIRECTIONS[dir]);
      result[dir] = (tile != null) ? this.tileIndex(tile) : null;
    }
    return result;
  };
};


/**
 * Auto generate a tile relations object for a cube with a given SIZE
 */
function autogenerateRelations(size) {
  var cg = new CubeGrid(size);
  var relations = {};
  for (var i = 0; i < cg.size*cg.size*6; i++) {
    relations[i] = cg.tileNeighbors(i);
  }
  return relations;
}

/**
 * Auto generate a tile relations object for a cube with a given SIZE and write to file
 */
function autogenerateRelationsFile(size) {
  var fs = require('fs');
  var filename = 'tile-auto-relations-'+size+'.json';
  fs.writeFile(filename, JSON.stringify(autogenerateRelations(size), null, 2), 
	       function(err) {
		 if(err) {
		   console.log(err);
		 } else {
		   fs.stat(filename, function (err, stats) {
		     console.log("generated: " + filename + " with " + (size*size*6*8) + 
				 " relations for " + size*size*6 + " tiles");
		     console.log("size: " + Math.round((stats.size / 1000))/1000 + "MB");
		   });
		 }
	       });
}


/**
 * Exports
 */
module.exports = {
  DIRECTIONS: DIRECTIONS,
  SIDES_PER_CUBE: SIDES_PER_CUBE,
  Sides: Sides,
  SideRelation: SideRelation,
  Tile: Tile,
  CubeGrid: CubeGrid,
  indexToTile: indexToTile,
  applyTransform: applyTransform,
  autogenerateRelations: autogenerateRelations,
  autogenerateRelationsFile: autogenerateRelationsFile
};
