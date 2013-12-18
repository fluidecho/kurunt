//
// Kurunt (main) API exposure.
// Can call this module from own node.js:
// var Kurunt = require("./index"); var kurunt = new Kurunt();
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var util 			= require('util');
var events 		= require('events');

var config 		= undefined;


var inputs 		= require('./inputs');
var workers 	= require('./workers');
var stores 		= require('./stores');
var Send	 		= require('./send');

// API files.
var newstream 		= require('./newstream');


// api:
exports.init = function(xconfig, xtopology, xworkers, xstores, callback){
	return new Kurunt(xconfig, xtopology, xworkers, xstores, callback)
}

/*
// TODO, add api functions:
Kurunt.prototype.getInputs 					= getInputs;
Kurunt.prototype.getWorkers 				= getWorkers;
Kurunt.prototype.getStores 					= getStores;
Kurunt.prototype.getStreams 				= getStreams;
//Kurunt.prototype.newStream 					= newStream;
Kurunt.prototype.openStream 				= openStream;
Kurunt.prototype.closeStream				= closeStream;
Kurunt.prototype.deleteStream 			= deleteStream;
//Kurunt.prototype.send					 			= send;


// client api:
//Kurunt.prototype.send 							= send;
exports.getMessages = function() {
	return new getMessages();
}
util.inherits(getMessages, events.EventEmitter);


// connection api:
Kurunt.prototype.newConnection 			= newConnection;
Kurunt.prototype.deleteConnection 	= deleteConnection;
*/




function Kurunt(xconfig, xtopology, xworkers, xstores, callback) {

	// set config.
	if ( xconfig != undefined ) {
		config = xconfig;
	} else {
		config = require('.././config.json');
	}
	
	if ( config.path === undefined || config.path === '' ) {
		config.path = __dirname;
	}
	
	config.xlog = function(m) { console.log(m); };

	try {
		var streams = require('.././streams.json');
	} catch(e) {
		var streams = undefined;
	}

	// set topology.
	if ( xtopology != undefined ) {
	//console.log('xtopology> ' + util.inspect(xtopology, true, 99, true));
		var topology = xtopology;
	} else {
		var topology = require('.././topology.json');
	}

	var workers = xworkers;
	if ( workers === undefined ) {
		//workers = '';
	}

	var stores = xstores;
	if ( stores === undefined ) {
		//stores = '';
	}
		
	var kurunt = {};

	// initiate kurunt application.
	var initiate = require('./init');
	initiate.init(config, topology, workers, stores, function(processes) {

		// TODO#1: nitiate.init should have proper callbacks waiting for each process to launch before !! HERE !!
		

		// callback: 'processes', can be used to send commands to each falked process, such as newStream, deleteStream etc.

		// launch web admin.
		var webadmin = require('./admin');		// will auto launch.
		webadmin.set_processes(processes);				// send falked 'processes' so admin can newStream, editStream, deleteStream to each process.

	
		// set functions for kurunt as module.
		var newStream = function (input, worker, stores, tags, access_hosts, newStreamCB) {
			//console.log('kurunt.js> newStream: ' + require('util').inspect(workerFunction, true, 99, true));
			
			// Crude rude (TODO#1) timeout to ensure new stream has opened on process, before allowing data to be sent to it.
			setTimeout(function () {
				newstream._new(processes, input, worker, stores, tags, access_hosts, function(stream) {
					return newStreamCB(stream);
				});
			}, 1000);			
			
		};	
	
	
		var send = function (stream, message, cb) {
			Send._send(stream, message, function(sent) {
				//console.log('xinputsDUMP> ' + util.inspect(inputs, true, 99, true));
				return cb(null, sent);
			});
		}	
	
		// exposes kurunt functions on callback.
		kurunt['processes'] = processes;
		kurunt['newStream'] = newStream;
		kurunt['send'] = send;
	
		console.log('Type ctrl+c to exit the program.\n>>>');
		
		return callback( kurunt );		// Now launched, return.
	
	});

	//if(false === (this instanceof Kurunt)) {
	//	return new Kurunt();
	//}

}






function getInputs(cb) {
	inputs._getInputs(config, function(inputs) {
		//console.log('xinputsDUMP> ' + util.inspect(inputs, true, 99, true));
		cb(null, inputs);
		return true;
	});
}



function getWorkers(cb) {
	workers._getWorkers(config, function(workers) {
		//console.log('xinputsDUMP> ' + util.inspect(workers, true, 99, true));
		cb(null, workers);
		return true;
	});
}



function getStores(cb) {
	stores._getStores(config, function(stores) {
		//console.log('xinputsDUMP> ' + util.inspect(stores, true, 99, true));
		cb(null, stores);
		return true;
	});
}



function getStreams(cb) {
//module.exports.getStreams = function (cb) {
	streams._getStreams(config, function(streams) {
		//console.log('streams DUMP> ' + util.inspect(streams, true, 99, true));
		cb(null, streams);
		return true;
	});
}



function openStream() {
	return true;
}



function closeStream() {
	return true;
}



function deleteStream() {
	return true;
}


function getMessages() {
	
}


function newConnection(object, namespace, zmq_pattern, zmq_socket, zmq_address) {
	return true;
}


function deleteConnection(object, namespace, zmq_pattern, zmq_socket, zmq_address) {
	return true;
}


