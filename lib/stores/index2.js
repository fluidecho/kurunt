//
// Kurunt Store
//
// Workers for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var util 						= require('util');
var mq 							= require('axon'); 
//require('axon-msgpack');

//var msgpack = require('msgpack-js');


var events 				= require('events');

exports.init = function(xconfig, connections) {
	return new init(xconfig, connections);
}
util.inherits(init, events.EventEmitter);




var uidNumberBands 		= require('uid-number-bands');

	
	
	
//console.log('config> ' + util.inspect(config, true, 99, true));


var MESSAGE_DELINEATE = 10;		// 'ascii code', delineated by linefeed: "\n"



var mps = 0;
var tot = 0;




process.on('SIGINT', function() {
	console.log('*@stores> SIGINT, stoping.');
  process.exit(0);
});

var stores = {};

/*
process.on('message', function(m) {
	console.log('*stores, process.on.message>' + util.inspect(m, true, 99, true));
	
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	
	init(config, topology);
	
});
*/









//this.init('','');


function init(xconfig, connections) {

	var self = this;

	uidNumberBands.init(99, 100);	










	var timeing =	setInterval(function () {		
		console.log('*@stores> mps: ' + mps + ' n: ' + tot);
		mps = 0;		// reset
	}, 1000);





	var sock = undefined;
	sock	= mq.socket('pull');
	sock.bind('tcp://127.0.0.1:3009');
	//sock.format('msgpack');
	console.log('connecting to pull@tcp://127.0.0.1:3009');
	sock.on('connected', function(c){
		console.log('stores connected');
	});


	//var buffer = '';		// as string.


	//var buffer 					= new Buffer(0);
	//var bufferLoop 			= new Buffer(0);
	//var messages 				= [];												// array of delineated buffer messages to send.


	var MESSAGE_DELINEATE = 10;	// \n linefeed, ascii 10.


	


	// MESSAGE ------------------------------------------------------------------------------------:
	sock.on('message', function(msgs){
		// NOTE: this, msgs will deliver whole message or messages not multipart, as from axon.

		console.log('msgs> ' + util.inspect(msgs, true, 99, true));

		var buffer 					= new Buffer(0);

		buffer = Buffer.concat([buffer, msgs], buffer.length + msgs.length);
		//console.log('buffer: ' + buffer);
	
		//var msgs = msgs;
		//var msgs = JSON.parse(msgs);
		//console.log('msgs: ' + msgs);
				
		//var del = msgs.toString().indexOf('\n');
		//console.log('del: ' + del);

		//var str = msgs.toString('ascii');


		var esc = -99;		// reason for setting to -99 so wont trigger when i = 0 if esc here was also 0.
		var i = 0, x = 0;
		for (i = 0; i < buffer.length; i++) {



			//console.log('msgs.readUInt8(i): ' + msgs.readUInt8(i));

			// check if delineate is escaped. ascii 47 = / (escaped).
			if ( buffer.readUInt8(i) == 47 ) {
				esc = i;
			}
			// delineate, MESSAGE_DELINEATE eg = 10 which is ascii for linefeed: \n
			if ( buffer.readUInt8(i) == MESSAGE_DELINEATE && i != (esc + 1) ) {
				//console.log('delineated at: ' + i);
					
					
				var m = buffer.slice(x, i); 
				//console.log('m> ' + util.inspect(m, true, 99, true));
					
				var message = JSON.parse(m);
				//console.log('message> ' + util.inspect(message, true, 99, true));
				
				var reply = null;
				self.emit('message', message, reply);	
				
				mps++;
				tot++;
				
				//var message = msgs.substring(x, i);
				x = i + 1;
					
				//console.log('message: ' + message);
				
				
			}
				
		}


	});
	
	
}






