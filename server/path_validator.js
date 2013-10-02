var relations = require('./cube_grid.js');

/**
 * Determine if a list of indices make a valid path
 */
var isAPath = function (path, size) {
  var cube = new relations.CubeGrid(size);
  return cube.isValidPath(path);
};


/**
 * Exports
 */
module.exports = {
  isAPath: isAPath
};








