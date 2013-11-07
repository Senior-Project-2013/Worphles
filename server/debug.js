var argv = require('optimist').argv;
var path = require('path');

var debug = new function() {
  
  this.trace = argv.trace;
  
  this.active = argv.trace || argv.debug;
  
  Object.defineProperty(global, '__stack', {
    get: function() {
      var orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function(_, stack) {
        return stack;
      };
      var err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      var stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
  });

  Object.defineProperty(global, '__line', {
    get: function() {
      return __stack[2].getLineNumber();
    }
  });

  Object.defineProperty(global, '__function', {
    get: function() {
      return __stack[2].getFunctionName();
    }
  });
  
  this.filename = function() {
    return path.basename(__stack[2].getFileName());
  };
  
  this.green = function(string) {
    return "\x1b[32m" + string + "\x1b[0m";
  };
  
  this.red = function(string) {
    return "\x1b[31m" + string + "\x1b[0m";
  };
  
  this.traceString = function(error) {
    return  ((error) ? this.red('error') : this.green('debug')) + '(' +
	this.filename() + " @ line " + __stack[2].getLineNumber()+') ' +
	this.green(':');
  };
  
  this.log = function() {
    if (this.active) {
      var argVals = new Array();
      for(var x in arguments) {
        argVals.push(arguments[x]);
      }
      if (this.trace) argVals = [this.traceString(null)].concat(argVals);
      console.log.apply(null, argVals);
    }
  };
  
  this.err = function() {
    if (this.active) {
      var argVals = new Array();
      for(var x in arguments) {
        argVals.push(arguments[x]);
      }
      if (this.trace) argVals = [this.traceString(true)].concat(argVals);
      console.log.apply(null, argVals);
    }
  };
};

module.exports = debug;
