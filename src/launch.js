//
// Kurunt Launch
//
// Launches node.js apps through /etc/init.d/.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var util 			= require('util');
var exec 			= require('child_process').exec;
var g 				= require("./functions.js");						// global functions and variables.


function launch(app, action) {
	
	g.log('*' + app);
	
	// use exec (small resturns) over spawn (large binary resturns), see: http://www.hacksparrow.com/difference-between-spawn-and-exec-of-node-js-child_process.html
	var child = exec('/etc/init.d/' + app + ' ' + action,
	  function (error, stdout, stderr) {
		if (error !== null) {
			console.log('error> ' + error);
		}
		if (stderr !== '') {
			console.log('stderr> ' + stderr);
		}	
		g.log('res> ' + stdout);
	});
}


function run(cmd, cb) {
	
	g.log('*' + cmd);
	
	// use exec (small resturns) over spawn (large binary resturns), see: http://www.hacksparrow.com/difference-between-spawn-and-exec-of-node-js-child_process.html
	var child = exec(cmd,
	  function (error, stdout, stderr) {
		if (error !== null) {
			console.log('error '+(cmd)+'> ' + error);
		}
		if (stderr !== '') {
			console.log('stderr '+(cmd)+'> ' + stderr);
		}	
		g.log('res '+(cmd)+'> ' + stdout);
		cb();
	});
}


// expose.
exports.launch 	= launch;
exports.run 	= run;