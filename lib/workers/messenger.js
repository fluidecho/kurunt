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

var logging 		= require('.././logging');

var MESSAGE_DELINEATE = '\n';	// delineate by linefeed.

var config						= undefined;
var socks 						= [];

var GUARANTEE_DELIVERY = false;		// feature in development, experimental, require('kurunt-axon') [https://github.com/markcode/kurunt-axon].

//var EventEmitter = require('events').EventEmitter;
//var ee = new EventEmitter();
//exports.init = init;


exports.init = function(xconfig, connections) {
	return new init(xconfig, connections);
}
util.inherits(init, events.EventEmitter);


exports.send 		= send;


var connections = undefined;


var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	logging.log('tcp@inputs> To use toobusy, you need to install >npm install toobusy -g');
}


// socket round robin (push, req) and broadcast (pub).
var rr = 0;			// round robin number, rr++ for each socket sent if push or req, staring at 1.
var rrx = 0;		// the round robin socket number currently sending messages on.

function init(xconfig, Connections) {
	
	connections = Connections;
	var self = this;

	config = xconfig;
	config["messenger_codec"] = 'json';	// this version, pass messages using json, much faster than msgpack.

	uidNumberBands.init(config['band'], config['bands'], true);		// start ids at 1 not 0.
	
	// zmq connections to make.
	logging.log('messenger@workers, connections> ', connections);
	var c = 0;
	for ( c = 0; c < connections.length; c++ ) {
		logging.log('messenger@workers> make ZMQ this connection for socket#' + c);
		
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
		logging.log('messenger@workers> zmq_pattern: ' + zmq_pattern );		
		
		if ( zmq_pattern === 'push' || zmq_pattern === 'rep' ) {
			rr++;
		}
		
		socks[c] = mq.socket(zmq_pattern);
		logging.log('messenger@workers> zmq_address: ' + connections[c]['zmq_address']);
		if ( connections[c]['zmq_socket'] === 'bind' ) {
 			socks[c].bind(connections[c]['zmq_address']);
 		} else {
 			socks[c].connect(connections[c]['zmq_address']);
 		}
		logging.log('messenger@workers> messenger, ' + connections[c]['zmq_socket'] + ':' + zmq_pattern + '@' + connections[c]['zmq_address']);		

		//socks[c].format('json');

		// SET this from connected axon socket so can control pause() and resume().
		socks[c].on('connect', function(a){
			
			var _this = this;
			
			var thisc = Number(c);
			
			logging.log('messenger@workers> CONNECTED -------------- socket#' + thisc);
		
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
			logging.log('worker A msg> ', msg);
			

			var _this2 = this;

			//var socketnum = c;

			//console.log('messenger@workers> got message on socket#' + socketnum);
			
			try {
			
				if ( toobusy != undefined ) {		
					if (toobusy()) {
						//console.log('*@workers> sock#' + c + ' Im toobusy.');
						_this2.socks[0].pause();
						setTimeout(function() {
							_this2.socks[0].resume();
							//console.log('*@workers> sock#' + c + ' Im not too busy, resume.');
						}, TOOBUSY_PAUSE);
					}
				}			


				var idb = msg.idb.toString();
				var unixtime = idb.substring(0, 10);
				var idn = Number(idb.substring(10));			

			
				var x = {};
				x.idb = idb;
				x.mLen = msg.messages.length;
				x.downstream = msg.downstream;
			
				
				var i = 0;
				//for ( var m in msg.messages ) {
				for ( i = 0; i < msg.messages.length; i++ ) {
					
					//var Mbuffer2 = new Buffer(msg.messages[i]['message']);
					//console.log('Mbuffer2: ' + Mbuffer2.toString(config['encoding']));		// convert buffer stream to string.
					
					if ( msg.messages[i]['id'] === undefined ) {
						var idx = unixtime.toString() + uidNumberBands._padd_number(idn);
						var id = uidNumberBands.parse(idx);
						idn++;		// now +1
					}
				
					var message 			= {};
					message.apikey 		= msg.apikey;
					message.input 		= msg.input;
					message.worker 		= msg.worker;
					
					// NOTE: clone - instead of cloning message, am writing stores back over message. use require('clone') or json if need to.		
					var stores = [];	// cleanup.
					for ( var s in msg.stores ) {
						//console.log('s: ' + msg.stores[s]);
						stores.push(msg.stores[s]);
					}
					
					
					
//console.log('worker stoo> ' + util.inspect(stores, true, 99, true));					
					
					message.stores		= stores;
					message.tags			= msg.tags;
					message.ns				= msg.ns;
					message.band			= msg.band;
					message.bands			= msg.bands;
					message.timedOut	= msg.timedOut;
					
					// set mime_type.
					if ( msg.input.object === 'http' ) {
						message.mime_type = msg.messages[i]['mime_type'];
					}
					
					// asign id if not allready set within message, http and udp inputs asigns id there.
					if ( msg.messages[i]['id'] === undefined ) {
						//console.log('workers, set ID!!!');
						message.id			= {};
						message.id			= id;
						//message.uid			= idx;
						//message.idn			= idn;
						//message.normalized_uid = idthis.normalized_uid;
					} else {
						message.id			= {};
						message.id			= msg.messages[i]['id'];
					}

//console.log('worker M msg> ' + util.inspect(msg.messages[i], true, 99, true));


					// if messenger_codec json then convert message to buffer.
					if ( config["messenger_codec"] === 'json' ) {
						var Mbuffer = new Buffer(msg.messages[i]['message']);
						//console.log('Mbuffer: ' + Mbuffer);					
						message.message 	= Mbuffer;						// the actual message contents.
					} else {
						message.message 	= msg.messages[i]['message'];
					}
					
//console.log('worker B msg> ' + util.inspect(message, true, 99, true));
					
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
						//console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
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

// TODO: round robin for batched messages.

	if ( batched_msg === "" ) {
		// start nagleish delay timmer.
		var nagleishTimeOut = (function () {
			setTimeout(function () {
				if ( batched_msg !== '' ) {
					
					var msg_temp = batched_msg;
					batched_msg = "";	
					//var msg = JSON.stringify(msg_temp);
					var msg = msg_temp;
					
					//sock_store.send(msg);
					
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
									//console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
									socks[s].send(msg);
								}
								rrs++;
							} else {
								// must be pub, so will broadcast message to every socket.
								//console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
								socks[s].send(msg);
							}
						}
					}						
					
					
					
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
		//sock_store.send(msg);
		
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
						//console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
						socks[s].send(msg);
					}
					rrs++;
				} else {
					// must be pub, so will broadcast message to every socket.
					//console.log('workers@messenger> send to store - ' + connections[s]['zmq_socket'] + ':' + connections[s]['zmq_pattern'] + '@' + connections[s]['zmq_address']);
					socks[s].send(msg);
				}
			}
		}	
		
		
	}

	// not filled yet, timeout in play.
	cb(true);
	return true;
	
}


