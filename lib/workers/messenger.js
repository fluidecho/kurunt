//
// Kurunt Messenger
//
// Listens for messages from ZMQ sockets, delineates individual messages, issues ids, parses, them emits as message event.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util 					= require('util');

var events 				= require('events');

var mq 							= require('axon'); 

var MESSAGE_DELINEATE = '\n';	// delineate by linefeed.

var uidNumberBands 		= require('uid-number-bands');



var config				= undefined;
var socks 				= [];


var GUARANTEE_DELIVERY = false;		// feature in development, experimental, require('kurunt-axon') [https://github.com/markcode/kurunt-axon].

var sock_store 				= undefined;	
var sock_stream 				= undefined;	



exports.init = function(xconfig, connections) {
	return new init(xconfig, connections);
}
util.inherits(init, events.EventEmitter);


//exports.init 		= init;

exports._send 		= _send;



//MotionLevelStream.prototype.write = function(xconfig, connections) {
function init(xconfig, connections) {


	console.log('LISTEN!!!');

	//this.readable = true;
	
	var self = this;
	//console.log('self> ' + util.inspect(self, true, 99, true));
	//_this 		= this;
	
	
	config = xconfig;
	config["messenger_codec"] = 'json';	// this version, pass messages using json, much faster than msgpack.
	

	uidNumberBands.init(config['band'], config['bands']);	
	
	
	// replace sock_store with topology.json connections.
	
	sock_store	= mq.socket('push');
	sock_store.connect('tcp://' + config['store_host'] + ':' + config['store_port']);
	//sock_store.format('msgpack');
	console.log('*@workers> conecting to store: push@' + config['store_host'] + ':' + config['store_port']);	
	sock_store.on('connect', function(a){
		console.log('sock_store CONNECTED --------------');	
	});	

	
	// zmq connections to make.
	console.log('connections> ' + util.inspect(connections, true, 99, true));
	var c = 0;
	for ( c = 0; c < connections.length; c++ ) {
		console.log('make ZMQ this connection!!!');
		
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
		console.log('zmq_pattern: ' + zmq_pattern );		
		
		
		socks[c] = mq.socket(zmq_pattern);
		console.log('zmq_address: ' + connections[c]['zmq_address']);
 		socks[c].connect(connections[c]['zmq_address']);
		console.log('messenger, connected: ' + zmq_pattern + '@' + connections[c]['zmq_address']);		


		socks[c].format('json');
		//socks[c].format('msgpack');
		
	//
	// SET this from connected axon socket so can control pause() and resume().
	socks[c].on('connect', function(a){
		console.log('CONNECTED --------------');
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
					
				//console.log(msg + " msglen: " + msg.length);		
						
				//msg = msgpack.decode(msg);
				//msg = JSON.parse(msg);
				//console.log('mDUMP> ' + util.inspect(msg, true, 99, true));
				//console.log('replyDUMP> ' + util.inspect(reply, true, 99, true));
			
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
					
					//console.log('msg.messages[i]> ' + util.inspect(message, true, 99, true));

					// need to pass reply for after processing complete.
					//self.emit('message', x, message, reply);
					self.emit('message', x, message, reply);

				
				}
		
			} catch(e) {
				// not valid message!
				self.emit('error', e);		
			}			
			

		});

	}
}


function _send(m, cb) {
	_nagleish_batching(m,function() { 
		// garbage collector.
	});
	cb(null, true);
	return true;
}


var Timer = function(){
	var start,
			end;

	return {
		start: function(){
			start = Date.now();
		},
		stop: function(){
			end = Date.now();
		},
		getTime: function(){
			return time = (end - start) / 1000;
		},
		getTimer: function(){
			return time = (Date.now() - start);
		}		
	};
}

	
// applies a nagle-ish algorithm (http://en.wikipedia.org/wiki/Nagle's_algorithm) for batching messages before sending to 0MQ/Axon.
// config['mq_nodelay'] = false, to apply this algorithm. When applyed speeds messages per seconds by 2 to 3 order of magnatude (~22k mps to ~90k mps).
var TCP_TRAIL_EXPIRES		= 200;				// Miliseconds, Timeout period for sending remaining messages.
var TCP_BUFFER_SIZE 		= 16450;				// Bytes, about TCP tuning see: http://pic.dhe.ibm.com/infocenter/aix/v6r1/index.jsp?topic=%2Fcom.ibm.aix.prftungd%2Fdoc%2Fprftungd%2Ftcp_streaming_workload_tuning.htm
	


var batched_m = [];
var batched_msg = '';
function _nagleish_batching(m, cb) {

//config['mq_nodelay'] = true;

	if ( config['mq_nodelay'] === true ) {
		//console.log('sending msg with mq_nodelay');
		sock_store.send(JSON.stringify(m) + '\n');		// delineate messages with '\n' linefeeds (ascii = 10).
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
					//var msg = JSON.stringify(msg_temp);
					var msg = msg_temp;	
		
		
		//console.log('mjson>' + msg + '<');
		sock_store.send(msg);

	}


	// not filled yet, timeout in play.
	cb(true);
	return true;
	
}


