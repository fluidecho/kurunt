//
// Client
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



// load dependencies.
var util 						= require('util');
var net 						= require('net');							


exports._send 			= _send;




function _send(config, m, cb) { 
	//config.xlog('loading data');

	// if address, eventid undefined then asumes this is test message.


	var client = net.connect({port: 5555}, function() {
		console.log('client connected');
		client.write(m + '\n');
	});
	client.on('data', function(data) {
		console.log(data.toString());
		client.end();
	});
	client.on('end', function() {
		console.log('client disconnected');
	});


	// note: the callback or event emitter is not executed by the input. kurunt processes data in a parallel pipeline pattern, not REQ REP like a client server does.

	// need a listening function EG: stream API to detect the eventid and return that.
	
	// could have two types of client.send functions: one returns a message callback function and the other is event emitter for eventid.

	//console.log('datas> ' + util.inspect(datas, true, 99, true));
	cb('');
	return true;

	
}





