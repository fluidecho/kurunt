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
var data 			= require('./data');
var client 		= require('./client');


// admin api:
exports.init = function(xconfig, xdata, xtopology){
	return new Kurunt(xconfig, xdata, xtopology)
}
Kurunt.prototype.getInputs 					= getInputs;
Kurunt.prototype.getWorkers 				= getWorkers;
Kurunt.prototype.getStores 					= getStores;
Kurunt.prototype.getData 						= getData;
Kurunt.prototype.newData 						= newData;
Kurunt.prototype.openData 					= openData;
Kurunt.prototype.closeData 					= closeData;
Kurunt.prototype.deleteData 				= deleteData;


// client api:
Kurunt.prototype.send 							= send;
exports.getMessages = function() {
	return new getMessages();
}
util.inherits(getMessages, events.EventEmitter);


// connection api:
Kurunt.prototype.newConnection 			= newConnection;
Kurunt.prototype.deleteConnection 	= deleteConnection;



function Kurunt(xconfig, xdata, xtopology) {

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


	// set data.
	if ( xdata != undefined ) {
		var data = xdata;
		// save data to data.json
	} else {
		var data = require('.././data.json');
	}

	// set topology.
	if ( xtopology != undefined ) {
	//console.log('xtopology> ' + util.inspect(xtopology, true, 99, true));
		var topology = xtopology;
	} else {
		var topology = require('.././topology.json');
	}

	// initiate kurunt application.
	var initiate = require('./init');
	initiate.init(config, data, topology);
	

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



function getData(cb) {
	data._getData(config, function(data) {
		//console.log('xinputsDUMP> ' + util.inspect(data, true, 99, true));
		cb(null, data);
		return true;
	});
}



function newData(nodes, inputs, worker, stores, tags, access_hosts, cb) {
	data._newData(config, nodes, inputs, worker, stores, tags, function(data) {
		//console.log('xinputsDUMP> ' + util.inspect(data, true, 99, true));
		cb(null, data);
		return true;
	});
}



function openData() {
	return true;
}



function closeData() {
	return true;
}



function deleteData() {
	return true;
}



function send(m, cb) {
	client._send(config, m, function(msg) {
		//console.log('xinputsDUMP> ' + util.inspect(inputs, true, 99, true));
		cb(null, msg);
		return true;
	});
}



function getMessages() {
	var self = this;

	setInterval(function () {		
		self.emit('message', 'hello world');
	}, 1000);	
	
	
	var ender = function() {
		self.emit('end');
	}	
	
}


function newConnection(object, namespace, zmq_pattern, zmq_socket, zmq_address) {
	return true;
}


function deleteConnection(object, namespace, zmq_pattern, zmq_socket, zmq_address) {
	return true;
}


