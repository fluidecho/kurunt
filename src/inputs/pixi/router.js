//
// Pixi Router
//
// Routes by client ip or open port.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Analumic.
//


var config				= require("./config.json");					// your config settings, like ports to open.

var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };


function route(handle, ip, message, port, request, response) {
	if ( typeof handle['*'] === 'function' ) {
		handle['*'](ip, message, port, request);
	} else if ( typeof handle[ip] === 'function' ) {
	console.log('rout ip');
		handle[ip](ip, message, port, request);
	} else if ( typeof handle[port] === 'function' ) {
		handle[port](ip, message, port, request);		
	} else {
		log("No client handler found for " + ip + " or open port " + port + " will try disconnecting client.");
		response.writeHead(404, {'Content-Type': 'application/json', 'Connection': 'closed'});
		response.end('{"message":"request not found"}\n');
	}
}


exports.route = route;		// expose.