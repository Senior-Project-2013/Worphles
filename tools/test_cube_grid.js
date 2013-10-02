#!/usr/bin/env node
/**
 * Colors
 */
String.prototype.green = function() {return "\x1b[32m" + this + "\x1b[0m";};
String.prototype.red = function() {return "\x1b[31m" + this + "\x1b[0m";};


var Test = function(func, args, expected) {
  this.func = func;
  this.args = args;
  this.expected = expected;
  this.passed = null;
  
  this.name = function() {
    var name = this.func.name;
    return (name != "") ? name : "λ";
  };
  
  this.run = function() {
    var expected_name = (typeof this.expected == "function") ? this.expected.name : this.expected;
    var string = this.name()+"("+this.args.join()+") == " + expected_name;
    try {
      var output = this.func.apply(null, this.args); 
      this.passed = output == this.expected;
      if (! this.passed) {
	string += " | GOT: " + output; 
      }
    } catch (err) {
      if (typeof expected == "function" && err.name == expected.name) {
	this.passed = true;
      } else {
	this.passed = false;
	string += " | CAUGHT: " + err;
      }
    } 
    if (! this.passed) {
      
    }
    console.log(" " + (this.passed ? "✓".green() : "✗".red()) + "  " + string);
  };
  
}

var Tester = function() {
  

  this.tests = [];

  this.def = function(func, args, expected) {
    this.tests.push(new Test(func, args, expected));
  };

  this.run = function() {
    console.log("\nRunning tests...\n");
    this.tests.forEach(function(test) {
      test.run();
    });
    
    var passes = (this.tests.filter(function(test) { return test.passed == true; })).length;
    var fails = this.tests.length - passes;

    console.log("\n" + this.tests.length + " tests run ");
    console.log("\tPassed: ".green() + ((passes == this.tests.length) ? "All" : passes));
    if (fails > 0) console.log("\tFailed: ".red() + fails);
    
    
  };

};


var cg = require('../server/cube_grid');
var tests = new Tester();
var cube4 = new cg.CubeGrid(4);

function testCubePath(cube, path) {
  return cube.isValidPath(path);
}

/**
 * size 4 tests
 */
// right
tests.def(testCubePath, [cube4, [0, 1, 2, 3]], true);
// up
tests.def(testCubePath, [cube4, [0, 4, 8, 12]], true);
//diag
tests.def(testCubePath, [cube4, [0, 5, 10, 15]], true);
//across
tests.def(testCubePath, [cube4, [3, 16]], true);
//across 0 -> 1 -> 4
tests.def(testCubePath, [cube4, [3, 16, 79]], true);
// disconnected
tests.def(testCubePath, [cube4, [0, 1, 2, 4]], false);
// negative
tests.def(testCubePath, [cube4, [0, 4, 8, -12]], false);
// single, out of bounds
tests.def(testCubePath, [cube4, [10000]], false);
tests.def(testCubePath, [cube4, [-10000]], false);
//Wrong types
tests.def(testCubePath, [cube4, []], TypeError);
tests.def(testCubePath, [3], TypeError);
tests.def(testCubePath, [{}], TypeError);
//double over
tests.def(testCubePath, [cube4, [0, 1, 5, 4, 0, 1]], false);

/**
 * 1x1 cube
 */
var cube1 = new cg.CubeGrid(1);

// go over all sides
tests.def(testCubePath, [cube1, [0, 4, 1, 2, 5, 3]], true);
// side zero touches 1, 3, 4, 5
tests.def(testCubePath, [cube1, [0, 1]], true);
tests.def(testCubePath, [cube1, [0, 5]], true);
tests.def(testCubePath, [cube1, [0, 3]], true);
tests.def(testCubePath, [cube1, [0, 4]], true);
// size zero should not touch 2
tests.def(testCubePath, [cube1, [0, 2]], false);

tests.run();
