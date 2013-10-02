#!/usr/bin/env node


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
    var alg = require('../server/coordinate-algorithm.js');
    alg.autogenerateRelationsFile(size, filename);
  } else {
    console.log("usage: tile-gen SIZE [filename]");
    process.exit(-1);
  }
})();



