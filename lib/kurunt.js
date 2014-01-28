//
// Kurunt (main) API exposure.
// Can call this module from own node.js:
// var Kurunt = require("./index"); var kurunt = new Kurunt();
//
// Version: 0.2.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var util 			= require('util');
var events 		= require('events');


var config 		= undefined;
var topology 	= undefined;
var kurunt 		= {};		// holding the kurunt api functions.


// API files.
var newstream = require('./newstream');
var Send 			= require('./send');


// expose kurunt:
exports.init = function(xworkers, xstores, callback){
	return new Kurunt(xworkers, xstores, callback)
}



// Kurunt.
function Kurunt(xworkers, xstores, callback) {

	config = require('.././config.json');
	
	if ( config.path === undefined || config.path === '' ) {
		config.path = __dirname;
	}
	
	topology = require('.././topology.json');

	var workers = xworkers;
	var stores = xstores;
		

	// initiate kurunt application.
	var initiate = require('./init');
	initiate.init(config, topology, workers, stores, function(processes) {

		// callback: 'processes', can be used to send commands to each falked process, such as newStream, deleteStream etc.

		// launch web admin.
		var webadmin = require('./admin');		// will auto launch.
		webadmin.set_processes(processes);				// send falked 'processes' so admin can newStream, editStream, deleteStream to each process.

	
		// set functions for kurunt as module.
		var newStream = function (input, worker, stores, tags, access_hosts, newStreamCB) {
			//console.log('kurunt.js> newStream: ' + require('util').inspect(workerFunction, true, 99, true));
			
			newstream._new(config, processes, webadmin, input, worker, stores, tags, access_hosts, function(stream) {
				return newStreamCB( null, stream );
			});
			
		};


		// exit function for all running node processes as set for this_node in topology.
		var exit = function () {
			for ( var p in processes ) {
				processes[p].kill();
			}
			process.exit(0);
		};

	
		var send = function (stream, message, cb) {
			Send._send(stream, message, function(sent) {
				//console.log('xinputsDUMP> ' + util.inspect(inputs, true, 99, true));
				return cb( null, sent);		// returns: error, sendFunc.
			});
		};
	
		// exposes kurunt functions on callback.
		kurunt['processes'] = processes;
		kurunt['newStream'] = newStream;
		kurunt['send'] = send;
		kurunt['exit'] = exit;
	
		// display if running stand-alone.
		if ( workers === undefined && stores === undefined ) {
			console.log('Type Ctrl+c to exit the program.\n>>>');
		}
	
/*		
setTimeout(function() {
	console.log('TIMEDOUT HERE !!!!!!!!!!!!!!!!!!!!!!!!!');
	var throwerror = require('throwerror');	// create error
	fs.readFile('somefile.txt', function (err, data) {
		//if (err) throw err;
		console.log(data);
	});	
	
}, 2000);			
*/	
	
		// handle uncaught exceptions, by logging and exiting. At this stage best practice would be then to restart with say forever/upstart.
		process.on('uncaughtException', function (err) {
			console.error('ERROR> ' + (new Date).toUTCString() + ' uncaughtException:', err.message);
			console.error(err.stack);
			kurunt.exit();		// exit all running node processes as set for this_node in topology, may not want to do this.
			process.exit(1);	// exit.
		});	
	
		
		return callback( null, kurunt );		// Now launched, return.
	
	});

}

