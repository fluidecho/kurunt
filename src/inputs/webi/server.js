//
// Webi Server
//
// HTTP restful API server.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var http 				= require('http');							// Load the HTTP Library.
var config				= require("./config.json");					// your config settings, like ports to open.

var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

// TODO: Support TLS (SSL) encrytion for incomming messages.

var server 				= [];										// servers open.

// Start a HTTP Server.
function start(route, handle, port) {
	function onRequest(request, response) {

		if (request.url === '/favicon.ico') {
			response.writeHead(200, {'Content-Type': 'image/x-icon'} );
			response.end();
			//log('<< favicon requested/returned.');
			return;
		}	

		// restrict requests to POST only.
		if (request.method != 'POST') {
			response.writeHead(405, {'Content-Type': 'application/json', 'Connection': 'closed'});
			response.end('{"message":"only POST method allowed"}\n');
			return;
		}			
		
		var ip = _ipAddress(request);
		var portStr = '"' + port + '"';
		
		log(ip + " requested on " + port + " >>");
	  
		// Handle incoming messages from clients.
		var data = '';
		var message = '';
		request.on('data', function (chunk) {
			data += chunk;		
		});
		
		// put together chunks to form whole messages before forwarding.
		request.on('end', function () {
			//console.log('data end');
			message = data;
			data = '';												// reset.
			route(handle, ip, message, port, response);
			
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.end('{"message":"received ok"}\n');	
		});		
		
	} // end onRequest.
	var portStr = '"' + port + '"';
	server[portStr] = http.createServer(onRequest).listen(port);
	log("Webi (input) '" + config['name'] + "' Server has opened on port: " + port + ".");
}


function _ipAddress(request) {
	// try request.connection.socket.remoteAddresponses for https, request.socket.remoteAddresponses works for most http but request.connection.remoteAddress seems more reliable.
	var ip = undefined;
	try {
		ip = request.headers['x-forwarded-for'];
		if ( ip === undefined ) {
			ip = __remoteAddress(request);
		}
	} catch ( err ) {
		ip = __remoteAddress(request);	
	}
	return ip;
}
function __remoteAddress(request) {
	var ip = undefined;
	ip = request.connection.remoteAddress;
	if ( ip === undefined ) {
		ip = request.socket.remoteAddresponses;
		if (ip === undefined) {
			return false;
		}
	}
	return ip;	
}
	
	
function stop(port) {
	var portStr = '"' + port + '"';
	server[portStr].close();										// close the server.
	log("Webi (input) '" + config['name'] + "' Server has closed on port: " + port + ".");	
}


exports.start 		= start;										// expose.
exports.stop 		= stop;											// expose.