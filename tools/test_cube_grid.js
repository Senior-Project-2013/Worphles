#!/usr/bin/env node

var cg = require('../server/cube_grid');
var fatty = require('fattest');
var tests = new fatty.Env();
var cube4 = new cg.CubeGrid(4);


function testCubePath(cube, path) {
  return cube.isValidPath(path);
}

/**
 * size 4 tests
 */
tests.defFor(cube4,
	     {
	       func: 'isValidPath',
	       args: [[0, 1, 2, 3]],
	       target: true
	     },
	     {
	       func: 'isValidPath',
	       args: [[0, 4, 8, 12]],
	       target: true
	     },
	     {
	       func: 'isValidPath',
               args: [[0, 5, 10, 15]],
	       target: true
	     },
	     {
	       func: 'isValidPath',
               args: [[3, 16]],
               target: true
	     },
	     {
               func: 'isValidPath',
               args: [[3, 16, 79]],
               target: true
             },
	     {
               func: 'isValidPath',
               args: [[0, 1, 2, 4]],
               target: false
             },
	     {
               func: 'isValidPath',
               args: [[0, 4, 8, -12]],
               target: false
             },
	     {
               func: 'isValidPath',
               args: [[10000]],
               target: false
             },
	     {
               func: 'isValidPath',
               args: [[-10000]],
               target: false
             },
	     {
               func: 'isValidPath',
               args: [[]],
               target: TypeError
             },
             {
               func: 'isValidPath',
               args: [3],
               target: TypeError
             },
             {
               func: 'isValidPath',
               args: [{}],
               target: TypeError
             },
             {
               func: 'isValidPath',
               args: [[0, 1, 5, 4, 0, 1]],
               target: false
             });
             
// tests.def(testCubePath, [cube4, [0, 1, 2, 3]],		true); // right
// tests.def(testCubePath, [cube4, [0, 4, 8, 12]],		true); // up
// tests.def(testCubePath, [cube4, [0, 5, 10, 15]],	true); //diag
// tests.def(testCubePath, [cube4, [3, 16]],		true); //across
// tests.def(testCubePath, [cube4, [3, 16, 79]],		true); //across 0 -> 1 -> 4
// tests.def(testCubePath, [cube4, [0, 1, 2, 4]],		false); // disconnected
// tests.def(testCubePath, [cube4, [0, 4, 8, -12]],	false); // negative
// tests.def(testCubePath, [cube4, [10000]],		false); // single, out of bounds
// tests.def(testCubePath, [cube4, [-10000]],		false);
// tests.def(testCubePath, [cube4, []],			TypeError); //Wrong types
// tests.def(testCubePath, [3],				TypeError);
// tests.def(testCubePath, [{}],				TypeError);
// tests.def(testCubePath, [cube4, [0, 1, 5, 4, 0, 1]],	false); //double over

/**
 * 1x1 cube
 */
var cube1 = new cg.CubeGrid(1);
tests.def(testCubePath, [cube1, [0, 4, 1, 2, 5, 3]],	true); // go over all sides
tests.def(testCubePath, [cube1, [0, 1]],		true); // side zero touches 1, 3, 4, 5
tests.def(testCubePath, [cube1, [0, 5]],		true);
tests.def(testCubePath, [cube1, [0, 3]],		true);
tests.def(testCubePath, [cube1, [0, 4]],		true);
tests.def(testCubePath, [cube1, [0, 2]],		false); // size zero should not touch 2

/**
 * 
 */
tests.run();
