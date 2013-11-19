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


var config			= require("./config.json");					// your config settings.
var net 				= require('net');										// Load the TCP Library.
//var util 			= require('util');


var log 				= function(txt) { if ( config['debug'] === 'benchmarking' || config['debug'] === 'debug' ) { console.log(txt); } };

var server 			= '';																// server opens.
var clients 		= {};																// tcp clients currently connected.
		
var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	console.log('tcp@inputs> To use toobusy, you need to install >npm install toobusy -g');
}


// Start a TCP Server.
module.exports.start = function (apikey, worker, stores, tags, route, messenger, access_hosts) {
	function onReceive(socket) {
    
    
		// Identify this client.
		var client = socket.remoteAddress + ":" + socket.remotePort;
		
		// Put this new client in the list
		clients[client] = [];
		clients[client]['address'] = socket.remoteAddress;
		clients[client]['port'] = socket.remotePort;
		clients[client]['socket'] = socket;	
		clients[client]['apikey'] = apikey;

		//log(client + " connected >>");


		socket.on('data', function(data) {
			//console.log('tcp@inputs> Got data from for apikey: ' + apikey + ', worker: ' + worker + ' data: ' + data);
				
			if ( toobusy != undefined ) {		
				if (toobusy()) {
					//console.log('tcp@inputs> Im toobusy!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
					socket.pause();
					setTimeout(function() {
						socket.resume();
						//console.log('tcp@inputs> Im not too busy, resume !!!');
					}, TOOBUSY_PAUSE);
				}
			}
			
			route(apikey, config['name'], worker, stores, tags, clients[client]['address'], data, messenger, access_hosts, function (res) {
				if ( res === false ) {
					//log("No client host access found for " + clients[client]['address'] + " on apikey: " + apikey + " will try disconnecting client.");
					clients[client]['socket'].end();  // disconect client.
					clients.splice(clients[client], 1);
				}
			});
		});

		// Remove the client from the array when it leaves.
		socket.on('end', function () {
			delete clients[client];
			log("<< " + client + " disconnected.");
		});
	
	} // end onReceive.

	server = net.createServer(onReceive).listen(apikey);
	log("TCP (input) Server has opened on port " + apikey + ".");
}


module.exports.stop = function () {
	server.close();
	server.on('close', function () {
		log("TCP (input) '" + config['name'] + "' Server has stoped.");
	});
}


