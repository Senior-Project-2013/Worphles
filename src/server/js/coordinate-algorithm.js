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

  
  side0.left = new SideRelation(side3, 0);
  side0.right = new SideRelation(side1, 0);
  side0.top = new SideRelation(side5, 0);
  side0.bottom = new SideRelation(side4, 0);

  side1.left = new SideRelation(side0, 0);
  side1.right = new SideRelation(side2, 0);
  side1.top = new SideRelation(side5, 1);
  side1.bottom = new SideRelation(side4, 3);
  
  side2.left = new SideRelation(side1, 0);
  side2.right = new SideRelation(side3, 0);
  side2.top = new SideRelation(side5, 2);
  side2.bottom = new SideRelation(side4, 2);
  
  side3.left = new SideRelation(side2, 0);
  side3.right = new SideRelation(side0, 0);
  side3.top = new SideRelation(side5, 3);
  side3.bottom = new SideRelation(side4, 1);
  
  side4.left = new SideRelation(side3, 3);
  side4.right = new SideRelation(side1, 1);
  side4.top = new SideRelation(side0, 0);
  side4.bottom = new SideRelation(side2, 2);
  
  side5.left = new SideRelation(side3, 1);
  side5.right = new SideRelation(side1, 3);
  side5.top = new SideRelation(side2, 2);
  side5.bottom = new SideRelation(side0, 0);

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
    point.x = (n-1) - point.x;
  }
  return point;
}



console.log(nextSpace(null, new gm.Point(0, 0), 0));
console.log(directionToVector(4).toString());
console.log(applyTransform(new gm.Point(0, 0), 1, 4));
console.log(applyTransform(new gm.Point(0, 1), 3, 4));
console.log(applyTransform(new gm.Point(1, 3), 2, 5));
console.log(applyTransform(new gm.Point(1, 3), 3, 5));
console.log(applyTransform(new gm.Point(1, 3), 4, 5));
console.log(applyTransform(new gm.Point(1, 3), 5, 5));

