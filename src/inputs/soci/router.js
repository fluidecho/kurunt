//
// Soci Router
//
// Routes by client host or open port.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Analumic.
//


var config				= require("./config.json");					// your config settings, like ports to open.

var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };


function route(handle, rAddress, rPort, message, port, socket) {
	if ( typeof handle['*'] === 'function' ) {
		handle['*'](rAddress, rPort, message, port);
	} else if ( typeof handle[rAddress] === 'function' ) {
		handle[rAddress](rAddress, rPort, message, port);
	} else if ( typeof handle[port] === 'function' ) {
		handle[port](rAddress, rPort, message, port);		
	} else {
		log("No client handler found for " + rAddress + " or open port " + port + " will try disconnecting client.");
		socket.end(); 		// disconect client.
	}
}


exports.route = route;		// expose.