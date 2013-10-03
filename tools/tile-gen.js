#!/usr/bin/env node

/**
 * Generates json files for tile relationships of any sized cube.
 * Files start getting huge after size 100, beware.
 */

/**
 * Is N a positive number?
 */
function isPositiveNumber(n) {
  return (!isNaN(parseFloat(n)) && isFinite(n) && n > 0);
}


/**
 * Main
 */
(function() {
  if (process.argv.length >= 3 && isPositiveNumber(process.argv[2])) {
    var size = parseInt(process.argv[2]);
    var filename = (process.argv.length > 3) ? process.argv[3] : undefined;
    
    var grid = require('../server/cube_grid.js');
    grid.autogenerateRelationsFile(size, filename);
    
  } else {
    console.log("Generates json files for tile relationships of any sized cube.");
    console.log("usage: tile-gen SIZE [filename]");
    process.exit(-1);
  }
})();



