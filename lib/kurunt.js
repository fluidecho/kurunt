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


// API files.
var newstream = require('./newstream');


// expose kurunt:
exports.init = function(xworkers, xstores, callback){
	return new Kurunt(xworkers, xstores, callback)
}



function Kurunt(xworkers, xstores, callback) {

	config = require('.././config.json');
	
	if ( config.path === undefined || config.path === '' ) {
		config.path = __dirname;
	}
	
	topology = require('.././topology.json');

	var workers = xworkers;

	var stores = xstores;
		
	var kurunt = {};

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
			
			newstream._new(config, processes, input, worker, stores, tags, access_hosts, function(stream) {
				return newStreamCB(stream);
			});
			
		};

			
		var exit = function () {
			for ( var p in processes ) {
				processes[p].kill();
			}
			process.exit(0);
		};

	
		var send = function (stream, message, cb) {
			Send._send(stream, message, function(sent) {
				//console.log('xinputsDUMP> ' + util.inspect(inputs, true, 99, true));
				return cb(null, sent);
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
		
		return callback( kurunt );		// Now launched, return.
	
	});

}

