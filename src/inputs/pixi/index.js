//
// Pixi Server
//
// Pixel server for web page visitor.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config				= require("./config.json");					// your config settings, like ports to open.
var version 			= 0.1;										// soci version number.

var server 				= require("./server");						// the tcp server.
var router 				= require("./router");						// routes the incomming messages by client connected.
var handlers 			= require("./handlers");					// handles (deals with) the messages by client as directed, then passes to ZeroMQ.


var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };


//
// required functions	:-
//
// _load				: called when kurunt starts (always).
// open					: called to open a port.
// close				: called to close a port.
//
// exposes functions	:
exports._load 			= _load;
exports.open			= open;
exports.close			= close;


var handle 				= {};

// does this app run standalone or as a module?
if ( config['run_standalone'] === true ) { this._load(); }


function _load() {

	if ( config['run_standalone'] === true ) {
		// copyright statement.
		console.log('Welcome to Pixi Server (input) (http://kurunt.org).\nVersion '+version+' (Apache License 2.0).\n\nCopyright (c) 2012 Mark W. B. Ashcroft.\nCopyright (c) 2012 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		console.log('*Pixi input started.');
	}

	
	handle["*"] = handlers.all;										// allow clients from any host and any open port handler - see README for more info.
	//handle["10.10.10.10"] = handlers.ip_10_10_10_10;				// example client ip specific handler, disable handle["*"].
	//handle["9999"] = handlers.port_9999;							// example of open port specific handler, disable handle["*"].

	
	// if using open_ports through sqlite (config.js) or config.json.
	if ( config['open_ports_db'] === true ) {
		var configDB = require("./config");
		configDB.openPosts(
		  function (ports) {		
			startServer(ports);
		});
	} else {
		startServer(config['open_ports']);
	}	
	
}


function startServer(ports) {
		
	if ( ports == '' ) {
		console.log("Pixi (input) '" + config['name'] + "' has no ports to open, goodbye.");
		if ( config['run_standalone'] === true ) {
			process.exit(0);  										// exit
		}
		return;														// return, do nada.
	}	
	
	var x = 0;
	// open a server for each open port in config 'port'.
	for ( x in ports ) {
		server.start(router.route, handle, ports[x]['port']);
	}
	
}

function open(port) {
	server.start(router.route, handle, port);
}

function close(port) {
	server.stop(port);
}