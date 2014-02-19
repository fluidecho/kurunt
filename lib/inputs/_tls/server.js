//
// TLS Server
//
// TLS server for secured tcp clients.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


var config			= require("./config.json");					// your local config settings.
var tls 				= require('tls');
var logging 		= require('../.././logging');
var fs 					= require('fs');										// so can read tls keys and certs.



process.on('uncaughtException', function (err) {
	logging.log('tls@inputs> uncaughtException: ' + err + ' err.code: ' + err.code);
	if ( err.code != 'ECONNRESET' ) {
		process.send({ error: err.stack });
	}
});	


// TLS options.
var options = {

	// the servers key and cert.
  key: fs.readFileSync(__dirname + '/server-private-key.pem'),
  cert: fs.readFileSync(__dirname + '/server-certificate.pem'),
 
  // This is necessary only if using the client certificate authentication.
  // Without this some clients don't bother sending certificates at all, some do
  requestCert: true,
 
  // Do we reject anyone who certs who haven't been signed by our recognised certificate authorities
  rejectUnauthorized: true,
 
  // This is necessary only if the client uses the self-signed certificate and you care about implicit authorization
  ca: [ fs.readFileSync(__dirname + '/client-certificate.pem') ]
 
};


var servers			= {};																// server opens each 'stream' (apikey).
exports.servers = servers;													// so index.js can close a server by 'stream' (apikey).

var clients 		= {};																// tls clients currently connected.
exports.clients = clients;													// so index.js can disconnect if close a stream.


var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	logging.log('tls@inputs> To use toobusy, you need to install >npm install toobusy -g');
}


// Start a TLS Server.
module.exports.start = function (apikey, route, messenger, streams) {
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
			logging.log('tls@inputs> Got data from for apikey: ' + apikey + ' data: ' + data.toString());

			//socket.write("123988277100000009\n"); 

			if ( toobusy != undefined ) {		
				if (toobusy()) {
					//console.log('tls@inputs> Im toobusy.');
					socket.pause();
					setTimeout(function() {
						socket.resume();
						//console.log('tls@inputs> Im not too busy, resume.');
					}, TOOBUSY_PAUSE);
				}
			}

			route(apikey, config['name'], clients[client]['address'], data, messenger, streams, function (res) {
				if ( res === false ) {
					logging.log("tls@inputs> No client host access found for " + clients[client]['address'] + " on apikey: " + apikey + " will try disconnecting client.");
					try {
						clients[client]['socket'].end();  			// disconect client.
						clients[client]['socket'].destroy();		// distroy ensures client disconnected.
						//clients.splice(clients[client], 1);
						delete clients[client];
					} catch(e) {
					}
				}
			});

		});

		// Remove the client from the array when it leaves.
		socket.on('end', function () {
			try {
				delete clients[client];
			} catch(e) {
			}			
			logging.log("tls@inputs> << " + client + " disconnected.");
		});

	} // end onReceive.

	servers[apikey] = tls.createServer(options, onReceive).listen(apikey);
	logging.log("tls@inputs> TLS (input) Server has opened on port " + apikey + ".");
}


module.exports.stop = function () {
	server.close();
	server.on('close', function () {
		logging.log("tls@inputs> TLS (input) '" + config['name'] + "' Server has stoped.");
	});
}


