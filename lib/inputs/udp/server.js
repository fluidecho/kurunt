//
// UDP Server
//
// UDP server for udp clients like syslog.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config			= require("./config.json");								// your config settings.
var gconfig			= require("../../.././config.json");			// your global config settings.
var dgram 			= require('dgram');												// Load the udp Library.
//var util 			= require('util');


var log 				= function(txt) { if ( config['debug'] === 'benchmarking' || config['debug'] === 'debug' ) { console.log(txt); } };


var uidNumberBands 	= require('uid-number-bands');
uidNumberBands.init(gconfig['band'], gconfig['bands']);


var servers			= {};																// server opens each 'stream' (apikey).
exports.servers = servers;													// so index.js can close a server by 'stream' (apikey).



var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	console.log('udp@inputs> To use toobusy, you need to install >npm install toobusy -g');
}




// Start a UDP Server.
module.exports.start = function (processID, apikey, route, messenger, streams) {
	function onReceive() {

		servers[apikey].on('message', function (message, rinfo) {
			//console.log(processID+'@inputs> Got message from for apikey: ' + apikey + ' from, ' + rinfo.address + ":" + rinfo.port + ', message: ' + message.toString());
/*
			if ( toobusy != undefined ) {		
				if (toobusy()) {
					//console.log('udp@inputs> Im toobusy.');
					// TODO: udp does not expose socket like tcp! how to pause?
					socket.pause();
					setTimeout(function() {
						socket.resume();
						//console.log('udp@inputs> Im not too busy, resume.');
					}, TOOBUSY_PAUSE);
				}
			}
*/

			var ida = uidNumberBands.make();
			var unixtime = ida.substring(0, 10);
			var idn = Number(ida.substring(10)) + 1;		// + 1 to start id range at ...000000001 rather than ...000000000
			var id = unixtime.toString() + uidNumberBands._padd_number(idn);
			route(apikey, config['name'], rinfo.address, message, id, messenger, streams, function (res) {
				if ( res === false ) {
					log(processID+'@inputs> No client host access found for ' + clients[client]['address'] + ' on apikey: ' + apikey + ' will ignore client.');
				}
			});

		});


	} // end onReceive.
	servers[apikey] = dgram.createSocket(config['type']);
	servers[apikey].bind(apikey, gconfig['host'], onReceive);
	servers[apikey].on('listening', function () {
		var address = servers[apikey].address();
		log(processID+'@inputs> UDP (input) Server opened apikey: ' + apikey + ' @ udp://' + address.address + ":" + address.port);
	});
}

