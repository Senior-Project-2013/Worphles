/**
 * Fattest, a small unit testing tool
 */

/**
 * String Colors
 */
String.prototype.fatGreen = function() {return "\x1b[32m" + this + "\x1b[0m";};
String.prototype.fatRed = function() {return "\x1b[31m" + this + "\x1b[0m";};


/**
 * A single test
 */
var Test = function(func, args, expected) {
  this.func = func;
  this.args = args;
  this.expected = expected;
  this.passed = null;

  
  /**
   * The derived name of the test
   */
  this.name = function() {
    var name = this.func.name;
    return (name != "") ? name : "λ";
  };
  

  /**
   * Run this test, display results, set this.passed
   */
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
    console.log(" " + (this.passed ? "✓".fatGreen() : "✗".fatRed()) + "  " + string);
  };
  
};


/**
 * Testing Environment
 */
var TestEnv = function() {

  /**
   * The tests
   */
  this.tests = [];

  /**
   * Define a new test, run FUNC with ARGS and assert the output == EXPECTED when run
   */
  this.def = function(func, args, expected) {
    this.tests.push(new Test(func, args, expected));
  };

  /**
   * Run all tests, display results
   */
  this.run = function() {
    console.log("\nRunning tests...\n");
    this.tests.forEach(function(test) {
      test.run();
    });
    
    var passes = (this.tests.filter(function(test) { return test.passed == true; })).length;
    var fails = this.tests.length - passes;

    console.log("\n" + this.tests.length + " tests run ");
    console.log("\tPassed: ".fatGreen() + ((passes == this.tests.length) ? "All" : passes));
    if (fails > 0) console.log("\tFailed: ".fatRed() + fails);
  };

};


/**
 * Exports
 */
module.exports = {
  Test: Test,
  Env: TestEnv // short name
};
