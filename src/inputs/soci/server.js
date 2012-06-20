//
// Soci Server
//
// TCP server for syslog and other tcp clients.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var net 				= require('net');							// Load the TCP Library.
var config				= require("./config.json");					// your config settings, like ports to open.

var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

// TODO: Support TLS (SSL) encrytion for incomming messages.

var server 				= [];										// servers open.
var clients 			= [];										// tcp clients currently connected.


// Start a TCP Server.
function start(route, handle, port) {
	function onReceive(socket) {

		// Identify this client.
		socket.name = socket.remoteAddress + ":" + socket.remotePort;
		
		// Put this new client in the list
		var portStr = '"' + port + '"';
		clients[portStr] = socket;
		
		// Send welcome connection.
		socket.write("Welcome to Soci Server " + socket.name + ".\n");
		log(socket.name + " connected on " + port + " >>");
	  
		// Handle incoming messages from clients.
		socket.on('data', function (data) {
			route(handle, socket.remoteAddress, socket.remotePort, data, port, socket);
		});
		  
		// Remove the client from the array when it leaves.
		socket.on('end', function () {
			clients.splice(portStr, 1);
			log("<< " + socket.name + " disconnected on " + port + ".");
		});
	
	} // end onReceive.
	var portStr = '"' + port + '"';
	server[portStr] = net.createServer(onReceive).listen(port);
	log("Soci (input) '" + config['name'] + "' Server has opened on port: " + port + ".");
}


function stop(port) {
	var portStr = '"' + port + '"';
	//console.log('portStr: ' + portStr);
	try {
		clients[portStr].end(); 									// disconect client.
	} catch (e) {
	}
	clients.splice(portStr, 1);	
	server[portStr].close();										// close the server.
	log("Soci (input) '" + config['name'] + "' Server has closed on port: " + port + ".");	
}


exports.start 		= start;										// expose.
exports.stop 		= stop;											// expose.