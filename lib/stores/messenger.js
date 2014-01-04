//
// Kurunt Messenger for Stores
//
// Listens for messages from zmq (axon) sockets, delineates individual messages, issues ids, parses, them emits as message event.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util 							= require('util');
var events 						= require('events');
var mq 								= require('axon'); 
var uidNumberBands 		= require('uid-number-bands');

var gconfig						= require('../.././config.json');
var log = function(txt, benchmarking, dump) { if ( dump != undefined && gconfig['loging'] === 'debug' ) { console.log(txt + ' >> ' + require('util').inspect(dump, true, 99, true)); } else if ( gconfig['loging'] === 'benchmarking' ) {	if ( benchmarking === true ) { console.log(txt); } } else if ( gconfig['loging'] === 'debug' ) { console.log(txt); } else if ( gconfig['loging'] === 'quiet' ) { } };

var MESSAGE_DELINEATE = 10;	// delineate by linefeed.

var config						= undefined;
var socks 						= [];

var GUARANTEE_DELIVERY = false;		// feature in development, experimental, require('kurunt-axon') [https://github.com/markcode/kurunt-axon].

exports.init = function(xconfig, connections) {
	return new init(xconfig, connections);
}
util.inherits(init, events.EventEmitter);


var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	log('tcp@inputs> To use toobusy, you need to install >npm install toobusy -g');
}

var connections = undefined;


function init(xconfig, Connections) {
	
	connections = Connections;
	var self = this;

	config = xconfig;
	config["messenger_codec"] = 'json';	// this version, pass messages using json, much faster than msgpack.

	uidNumberBands.init(config['band'], config['bands']);	
	
	// zmq connections to make.
	log('messenger@stores, connections> ', false, connections);
	var c = 0;
	for ( c = 0; c < connections.length; c++ ) {
		log('messenger@stores> make ZMQ this connection!!!');
		
		var zmq_pattern = connections[c]['zmq_pattern'];
		// if guaranteed delivery and pattern is push, change to req.
		if ( GUARANTEE_DELIVERY ) {
			if ( zmq_pattern === 'push' ) {
				zmq_pattern = 'req';
			}
			if ( zmq_pattern === 'pull' ) {
				zmq_pattern = 'rep';
			}			
		}
		log('messenger@stores> zmq_pattern: ' + zmq_pattern );		
		
		socks[c] = mq.socket(zmq_pattern);
		log('messenger@stores> zmq_address: ' + connections[c]['zmq_address']);
		if ( connections[c]['zmq_socket'] === 'bind' ) {
 			socks[c].bind(connections[c]['zmq_address']);
 		} else {
 			socks[c].connect(connections[c]['zmq_address']);
 		}
		log('messenger@stores> messenger, ' + connections[c]['zmq_socket'] + ':' + zmq_pattern + '@' + connections[c]['zmq_address']);			

		//socks[c].format('json');

		// SET this from connected axon socket so can control pause() and resume().
		socks[c].on('connect', function(a){
			log('messenger@stores> CONNECTED --------------');
			var _this = this;
		
			exports.pause = function() {
				//console.log('PAUSE!!!! --------------');
				_this.socks[0].pause();
				return true;
			}
		
			exports.resume = function() {
				//console.log('RESUME!!!! --------------');
				_this.socks[0].resume();
				return true;
			}		
		});

		var buffer = '';		// as string.
		// MESSAGE ------------------------------------------------------------------------------------:
		socks[c].on('message', function(msgs){
			// NOTE: this, msgs will deliver whole message or messages not multipart, as from axon.

			//console.log('msgs> ' + util.inspect(msgs, true, 99, true));


			var _this2 = this;

			if ( toobusy != undefined ) {		
				if (toobusy()) {
					//console.log('*@stores> sock#' + c + ' Im toobusy.');
					_this2.socks[0].pause();
					setTimeout(function() {
						_this2.socks[0].resume();
						//console.log('*@stores> sock#' + c + ' Im not too busy, resume.');
					}, TOOBUSY_PAUSE);
				}
			}	



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
					//console.log('messenger@stores> message> ' + util.inspect(message, true, 99, true));
				
					var reply = null;
					var x = {};
					self.emit('message', x, message, reply);	
				
					//mps++;
					//tot++;
				
					//var message = msgs.substring(x, i);
					x = i + 1;
					
					//console.log('message: ' + message);
				
				
				}
				
			}


		});
	

	}
}


