//
// Kurunt JSONCarrier
//
// Parser which listens for chunks from socket, delineates into individual messages, parses into js 
// object (from json) then emits as message event.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util = require('util');
var events = require('events');


exports.parse = function(config) {
	return new parse(config);
}

util.inherits(parse, events.EventEmitter);



//var msgpack 		= require('/usr/local/lib/node_modules/axon-msgpack/node_modules/msgpack-js');

// If zmq (ZeroMQ) available use, else use Axon.
/*
try {
	var mq			= require('zmq');
	console.log('using ZMQ');
} catch(e) {
	var mq 			= require('axon');
	console.log('using AXON');
}
*/
var mq 			= require('axon');
var sock 			= mq.socket('pull');


function parse(config) {
	var self = this;
	//self.socket = socket;

	sock.bind('tcp://127.0.0.1:3055');
	console.log('jsoncarrier, connected to: ' + 'tcp://127.0.0.1:3055');

	if ( !config['message_encoding'] ) {
		config['message_encoding'] = 'utf8';
	}

	var buffer = '';		// as string.
	sock.on('message', function(chunk){
		

				//console.log('DUMPchunk> ' + util.inspect(chunk, true, 99, true));
				//var message_message = msg.toString(config['message_encoding']);

				//console.log('chunk: ' + chunk + 'EOC');

				//var chunk_decoded = msgpack.decode(chunk);
				//self.emit('message', chunk_decoded);


				buffer += chunk.toString(config['message_encoding']);		// convert buffer stream to string.
				
				//console.log('DUMPbuffer> ' + util.inspect(buffer, true, 99, true));
		 
				// NOTE: \n for unix/linux and modern mac, \r\n for windows, so both should deliniate 
				// okay using just \n.
				var delineate = '\n';

				var index, message_message;
				while((index = buffer.indexOf(delineate)) > -1) {
					message = buffer.slice(0, index);

					//console.log('message: ' + message);

					buffer = buffer.slice(index + 1);
					if(message.length > 0) {
						try {
							var message_json = JSON.parse(message);
							//console.log('DUMPunjason> ' + util.inspect(message_json, true, 99, true));
							self.emit('message', message_json);
						} catch(e) {
							//console.log('jsoncarrier error: ' + e.message);
							self.emit('error', e);
						}
					}
					
				}


		

	});

	var ender = function() {
		if (buffer.length > 0) {
			self.emit('message', buffer);
			//console.log('buffer: ' + buffer + 'EOE');
			buffer = '';
		}
		self.emit('end');
	}

	//socket.on('end', ender);
}


