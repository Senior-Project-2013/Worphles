var gm = require('./geometry.js');
var assert = require('assert');

function tileToIndex(tile, size) {
  return (tile.side * (size * size)) + (tile.pos.y * size) + tile.pos.x;
}


var DIRECTIONS = {
  right: 0,
  upRight: 1,
  up: 2,
  upLeft: 3,
  left: 4,
  downLeft: 5,
  down: 6,
  downRight: 7
}

function directionToVector(n) {
  switch(n) {
  case DIRECTIONS.right: return new gm.Point(1, 0);
  case DIRECTIONS.upRight: return new gm.Point(1, 1);
  case DIRECTIONS.up: return new gm.Point(0, 1);
  case DIRECTIONS.upLeft: return new gm.Point(-1, 1);
  case DIRECTIONS.left: return new gm.Point(-1, 0);
  case DIRECTIONS.downLeft: return new gm.Point(-1, -1);
  case DIRECTIONS.down: return new gm.Point(0, -1);
  case DIRECTIONS.downRight: return new gm.Point(1, -1);
  default: return null;;
  }  
}

var Tile = function(side, point) {
  return {
    side: side,
    pos: point
  };
}
var Side = function() {
  return {
    left: null,
    right: null,
    abov: null,
    below: null
  };
};

var SideRelation = function(side, rotations) {
  return {
    side: side,
    rotations: rotations
  };
};


var Sides = function() {
  return [{
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
};



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




// console.log(directionToVector(4).toString());
// console.log(applyTransform(new gm.Point(0, 0), 1, 4));
// console.log(applyTransform(new gm.Point(0, 1), 3, 4));
// console.log(applyTransform(new gm.Point(1, 3), 2, 5));
// console.log(applyTransform(new gm.Point(1, 3), 3, 5));
// console.log(applyTransform(new gm.Point(1, 3), 4, 5));
// console.log(applyTransform(new gm.Point(1, 3), 5, 5));

var CubeGrid = function(size) {
  this.grid = [];
  this.size = size;
  for (var i = 0; i < size * size * 6; i++) {
    this.grid[i] = {
      right: null,
      topRight: null,
      top: null,
      topLeft: null,
      left: null,
      bottomLeft: null,
      bottom: null,
      bottomRight: null
    };
  }
  return grid;
}


function indexToTile(index, size) {
  assert(index > 0 &&index < size*size*6);
  var side = Math.floor(index / (size * size));
  var sideIndex = index - side * (size * size);
  return Tile(side, new gm.Point(sideIndex % size, Math.floor(sideIndex / size)));
}

function nextTile(tile, direction, size) {
  console.log(tile);
  console.log(direction);
  var sides = new Sides();
  var nextTile = tile;
  var thisSide = sides[nextTile.side];
  nextTile.pos = nextTile.pos.add(directionToVector(direction));
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
  console.log(nextTile);
  return nextTile;
}
