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
console.log(applyTransform(new gm.Point(1, 3), 0, 5));
console.log(applyTransform(new gm.Point(1, 3), 1, 5));
console.log(applyTransform(new gm.Point(1, 3), 2, 5));
console.log(applyTransform(new gm.Point(1, 3), 3, 5));
console.log(applyTransform(new gm.Point(1, 3), 4, 5));
console.log(applyTransform(new gm.Point(1, 3), 5, 5));
