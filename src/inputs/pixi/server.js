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

		// restrict requests to GET only.
		if (request.method != 'GET') {
			response.writeHead(405, {'Content-Type': 'application/json', 'Connection': 'closed'});
			response.end('{"message":"only GET method allowed"}\n');
			return;
		}			
		
		var ip = _ipAddress(request);
		var portStr = '"' + port + '"';
		
		log(ip + " requested on " + port + " >>");
	  
		// Handle incoming messages from clients.
		request.on('end', function () {
			//var util 				= require('util');
			//console.log( 'DUMP> ' + util.inspect(request, true, 99, true) );
			// check for referrer.
			var referer 			= request.headers.referer;
			if ( referer != undefined ) {
				var message			= 'pixel';						// there is no actual message data sent.
				route(handle, ip, message, port, request, response);
			}
		});
		
		response.writeHead(200, {
			'Content-Length': '43', 
			'Content-Type': 'image/gif',
			'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Pragma': 'no-cache',
			'Connection': 'close'
		});
		response.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');
		
	} // end onRequest.
	var portStr = '"' + port + '"';
	server[portStr] = http.createServer(onRequest).listen(port);
	log("Pixi (input) '" + config['name'] + "' Server has opened on port: " + port + ".");
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
	log("Pixi (input) '" + config['name'] + "' Server has closed on port: " + port + ".");	
}


exports.start 		= start;										// expose.
exports.stop 		= stop;											// expose.