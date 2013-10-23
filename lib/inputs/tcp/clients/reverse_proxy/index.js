//
// TCP Reverse Proxy
//
// TCP reverse proxy for testing multiple Kurunt inputs.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var net = require('net');


var CLIENT_TCP_PORT = 3333;		// the input port for the incomming data.
var KURUNT_TCP_PORT = [5555, 5556];		// set kurunt tcp inputs as set in data.json port, will round robin these.


var n = 0;
var kurunt_tcp = [];
var client_connected = false;

for ( var input in KURUNT_TCP_PORT ) {

	kurunt_tcp[input] = net.connect({port: KURUNT_TCP_PORT[input]}, function() {
		console.log('connected to kurunt tcp input on port: ' + KURUNT_TCP_PORT[input]);
	
		if ( client_connected === false ) {
			client_connected = true;
			var client_server = net.createServer(function(socket) {
				console.log('server connected');
				socket.on('end', function() {
					console.log('server disconnected');
				});
				socket.on('data', function(data) {
					console.log(data.toString());
					var len = KURUNT_TCP_PORT.length
					var sock = kurunt_tcp[n++ % len];		// round robin the KURUNT_TCP_PORTs.
					sock.write(data);
				});
			});
			client_server.listen(CLIENT_TCP_PORT, function() {
				console.log('server bound');
			});
		}
	
	});

}

