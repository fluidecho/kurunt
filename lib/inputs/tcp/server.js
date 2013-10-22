//
// TCP Server
//
// TCP server for tcp clients like syslog.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config				= require("./config.json");								// your config settings.
var net 				= require('net');										// Load the TCP Library.

var log 				= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

var server 				= '';												// server opens.
var clients 			= [];												// tcp clients currently connected.

var util 				= require('util');
// Start a TCP Server.
//function start(apikey, route, handle) {
function start(messenger, port, apikey, worker, stores, tags, route) {
	function onReceive(socket) {

		// Identify this client.
		var client = socket.remoteAddress + ":" + socket.remotePort;
		
		// Put this new client in the list
		clients[client] = [];
		clients[client]['address'] = socket.remoteAddress;
		clients[client]['port'] = socket.remotePort;
		clients[client]['socket'] = socket;	
		clients[client]['apikey'] = apikey;

		log(client + " connected >>");

		socket.on('data', function(data) {
			//console.log('Got data from for apikey: ' + apikey + ', worker: ' + worker + ' data: ' + data);
			route(messenger, apikey, config['name'], worker, stores, tags, clients[client], data);
		});

		// Remove the client from the array when it leaves.
		socket.on('end', function () {			
			clients.splice(clients[client], 1);
			log("<< " + client + " disconnected.");
		});
	
	} // end onReceive.

	server = net.createServer(onReceive).listen(port);
	log("TCP (input) Server has opened on port " + port + ".");
}



function stop() {
	server.close();
	server.on('close', function () {
		log("TCP (input) '" + config['name'] + "' Server has stoped.");
	});
}


exports.start 			= start;											// expose.
exports.stop 			= stop;											// expose.
