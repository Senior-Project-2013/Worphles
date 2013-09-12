var gm = require('./geometry.js');

function nextSpace(side, point, direction) {
  var dirV = directionToVector(direction);
  return point.add(dirV);
}

function directionToVector(n) {
  switch(n) {
  case 0: return new gm.Point(1, 0);
  case 1: return new gm.Point(1, 1);
  case 2: return new gm.Point(0, 1);
  case 3: return new gm.Point(-1, 1);
  case 4: return new gm.Point(-1, 0);
  case 5: return new gm.Point(-1, -1);
  case 6: return new gm.Point(0, -1);
  case 7: return new gm.Point(1, -1);
  default: return null;;
  }  
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
  var side0 = new Side();
  var side1 = new Side();
  var side2 = new Side();
  var side3 = new Side();
  var side4 = new Side();
  var side5 = new Side();

  var _0deg = 0;
  var _90deg = 1;
  var _180deg = 2;
  var _270deg = 3;
  
  
  side0.left = new SideRelation(side3, _0deg);
  side0.right = new SideRelation(side1, _0deg);
  side0.top = new SideRelation(side5, _0deg);
  side0.bottom = new SideRelation(side4, _0deg);
  
  side1.left = new SideRelation(side0, _0deg);
  side1.right = new SideRelation(side2, _0deg);
  side1.top = new SideRelation(side5, _90deg);
  side1.bottom = new SideRelation(side4, _270deg);
  
  side2.left = new SideRelation(side1, _0deg);
  side2.right = new SideRelation(side3, _0deg);
  side2.top = new SideRelation(side5, _180deg);
  side2.bottom = new SideRelation(side4, _180deg);
  
  side3.left = new SideRelation(side2, _0deg);
  side3.right = new SideRelation(side0, _0deg);
  side3.top = new SideRelation(side5, _270deg);
  side3.bottom = new SideRelation(side4, _90deg);
  
  side4.left = new SideRelation(side3, _270deg);
  side4.right = new SideRelation(side1, _90deg);
  side4.top = new SideRelation(side0, _0deg);
  side4.bottom = new SideRelation(side2, _180deg);
  
  side5.left = new SideRelation(side3, _90deg);
  side5.right = new SideRelation(side1, _270deg);
  side5.top = new SideRelation(side2, _180deg);
  side5.bottom = new SideRelation(side0, _0deg);

  return {
    side0: side0,
    side1: side1,
    side2: side2,
    side3: side3,
    side4: side4,
    side5: side5
  };
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
    point.x = (n-_90deg) - point.x;
  }
  return point;
}

console.log(nextSpace(null, new gm.Point(0, _0deg), _0deg));
console.log(directionToVector(4).toString());
console.log(applyTransform(new gm.Point(0, _0deg), 1, 4));
console.log(applyTransform(new gm.Point(0, _90deg), 3, 4));
console.log(applyTransform(new gm.Point(1, _270deg), 2, 5));
console.log(applyTransform(new gm.Point(1, 3), 3, 5));
console.log(applyTransform(new gm.Point(1, 3), 4, 5));
console.log(applyTransform(new gm.Point(1, 3), 5, 5));
