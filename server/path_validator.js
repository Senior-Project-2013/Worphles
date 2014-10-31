var relations = require('./cube_grid.js');

/**
 * Determine if a list of indices make a valid path
 */
var isAPath = function (path, size) {
  return relations.getGrid(size).isValidPath(path);
};


/**
 * Exports
 */
module.exports = {
  isAPath: isAPath
};








