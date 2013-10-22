//
// Kurunt Messenger for Workers
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


var MESSAGE_DELINEATE = '\n';	// delineate by linefeed.

var config						= undefined;
var socks 						= [];

var GUARANTEE_DELIVERY = false;		// feature in development, experimental, require('kurunt-axon') [https://github.com/markcode/kurunt-axon].

exports.init = function(xconfig, connections) {
	return new init(xconfig, connections);
}
util.inherits(init, events.EventEmitter);


exports.send 		= send;


var connections = undefined;


// socket round robin (push, req) and broadcast (pub).
var rr = 0;			// round robin number, rr++ for each socket sent if push or req, staring at 1.
var rrx = 0;		// the round robin socket number currently sending messages on.

function init(xconfig, Connections) {
	
	connections = Connections;
	var self = this;

	config = xconfig;
	config["messenger_codec"] = 'json';	// this version, pass messages using json, much faster than msgpack.

	uidNumberBands.init(config['band'], config['bands']);	
	
	// zmq connections to make.
	console.log('messenger@workers, connections> ' + util.inspect(connections, true, 99, true));
	var c = 0;
	for ( c = 0; c < connections.length; c++ ) {
		console.log('messenger@workers> make ZMQ this connection!!!');
		
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
		console.log('messenger@workers> zmq_pattern: ' + zmq_pattern );		
		
		if ( zmq_pattern === 'push' || zmq_pattern === 'rep' ) {
			rr++;
		}
		
		socks[c] = mq.socket(zmq_pattern);
		console.log('messenger@workers> zmq_address: ' + connections[c]['zmq_address']);
		if ( connections[c]['zmq_socket'] === 'bind' ) {
 			socks[c].bind(connections[c]['zmq_address']);
 		} else {
 			socks[c].connect(connections[c]['zmq_address']);
 		}
		console.log('messenger@workers> messenger, ' + connections[c]['zmq_socket'] + ':' + zmq_pattern + '@' + connections[c]['zmq_address']);		

		//socks[c].format('json');

		// SET this from connected axon socket so can control pause() and resume().
		socks[c].on('connect', function(a){
			console.log('messenger@workers> CONNECTED --------------');
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
		socks[c].on('message', function(msg, reply){
	
			var _this = this;
			
			try {

				var idb = msg.idb.toString();
				var unixtime = idb.substring(0, 10);
				var id = Number(idb.substring(10));			
			
				var x = {};
				x.idb = idb	;
				x.mLen = msg.messages.length;
				x.downstream = msg.downstream;
			
				var i = 0;
				//for ( var m in msg.messages ) {
				for ( i = 0; i < msg.messages.length; i++ ) {
					//console.log('m: ' + msg.messages[m].toString(config['encoding']));		// convert buffer stream to string.
					
					id++;
					var idx = unixtime.toString() + uidNumberBands._padd_number(id);
					//console.log(idx);
				
					var message 			= {};
					message.apikey 		= msg.apikey;
					message.input 		= msg.input;
					message.worker 		= msg.worker;
					message.stores		= msg.stores;
					message.tags			= msg.tags;
					message.ns				= msg.ns;
					message.host			= msg.host;
					message.port			= msg.port;				
					message.band			= msg.band;
					message.bands			= msg.bands;
					message.timedOut	= msg.timedOut;
					message.id 				= idx;

					// if messenger_codec json then convert message to buffer.
					if ( config["messenger_codec"] === 'json' ) {
						var Mbuffer = new Buffer(msg.messages[i]);
						//console.log('Mbuffer: ' + Mbuffer);					
						message.message 	= Mbuffer;						// the actual message contents.
					} else {
						message.message 	= msg.messages[i];
					}
					
					// need to pass reply for after processing complete.
					self.emit('message', x, message, reply);
				
				}
		
			} catch(e) {
				// not valid message!
				self.emit('error', e);		
			}			
			

		});

	}
}


function send(m, cb) {
	//console.log('SEND');
	_nagleish_batching(m,function() { 
		// garbage collector.
	});
	cb(null, true);
	return true;
}


	
// applies a nagle-ish algorithm (http://en.wikipedia.org/wiki/Nagle's_algorithm) for batching messages before sending to 0MQ/Axon.
// config['mq_nodelay'] = false, to apply this algorithm. When applyed speeds messages per seconds by 2 to 3 order of magnatude (~22k mps to ~90k mps).
var TCP_TRAIL_EXPIRES		= 200;				// Miliseconds, Timeout period for sending remaining messages.
var TCP_BUFFER_SIZE 		= 16450;				// Bytes, about TCP tuning see: http://pic.dhe.ibm.com/infocenter/aix/v6r1/index.jsp?topic=%2Fcom.ibm.aix.prftungd%2Fdoc%2Fprftungd%2Ftcp_streaming_workload_tuning.htm





var batched_m = [];
var batched_msg = '';
function _nagleish_batching(m, cb) {
//console.log('nagleish');
//config['mq_nodelay'] = true;

	if ( config['mq_nodelay'] === true ) {
		//console.log('sending msg with mq_nodelay');
		
		// need a way to add some logic to decide how to apply the zeromq pattern.
		// if push or req - roundrobin, if pub - broadcast.
		
		//console.log('rr> ' + util.inspect(rr, true, 99, true));
		//console.log('rrx> ' + util.inspect(rrx, true, 99, true));
		rrx++;
		var rrxnext = rrx % rr;
		var rrs = 0;
		//console.log('rrxnext> ' + util.inspect(rrxnext, true, 99, true));
		
		//console.log('connections> ' + util.inspect(connections, true, 99, true));
		var s = 0;
		for ( s = 0; s < connections.length; s++ ) {
			//console.log('connection s: ' + s);
			//console.log('connection[s]> ' + util.inspect(connections[s], true, 99, true));
			if ( connections[s]['object'] === 'store' ) {
				//console.log('is connection for store!');
				if ( connections[s]['zmq_pattern'] === 'push' || connections[s]['zmq_pattern'] === 'req' ) {
					if ( rrs === rrxnext ) {
						console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
						socks[s].send(JSON.stringify(m) + '\n');		// delineate messages with '\n' linefeeds (ascii = 10).
					}
					rrs++;
				} else {
					// must be pub, so will broadcast message to every socket.
					//console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
					socks[s].send(JSON.stringify(m) + '\n');		// delineate messages with '\n' linefeeds (ascii = 10).
				}
			}
		}		
		
		// return after has looped through all connections within topolgy and sent message.
		cb(true);
		return true;	

	}

	if ( batched_msg === "" ) {
		// start nagleish delay timmer.
		var nagleishTimeOut = (function () {
			setTimeout(function () {
				if ( batched_msg !== '' ) {
					
					var msg_temp = batched_msg;
					batched_msg = "";	
					//var msg = JSON.stringify(msg_temp);
					var msg = msg_temp;
					
					sock_store.send(msg);
				}
			}, TCP_TRAIL_EXPIRES);
		})();	
	}

	if ( m !== '' ) {
		//batched_m.push(m);
		batched_msg += JSON.stringify(m) + '\n';		// delineate messages with '\n' linefeeds (ascii = 10).
	}

	var batched_size = Buffer.byteLength(batched_msg, config['encoding']);
	if ( batched_size > TCP_BUFFER_SIZE || m === '' && batched_size > 0 ) {
		clearTimeout(nagleishTimeOut);				// reset timer for timeout.
		var msg_temp = batched_msg;
		batched_msg = "";	
		var msg = msg_temp;	
		sock_store.send(msg);
	}

	// not filled yet, timeout in play.
	cb(true);
	return true;
	
}


