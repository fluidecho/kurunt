//
// Messenger (inputs)
//
// Queue and send messages via TCP to Kurunt workers.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util 					= require('util');
var config					= require("./config.json");								// your config settings.
var log 						= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

console.log('dir: ' + __dirname);

//var mq 							= require('../../../.././kurunt-axon');
var mq 							= require('axon');



var uidNumberBands 	= require('uid-number-bands');
uidNumberBands.init(config['band'], config['bands']);



var util 						= require('util');

var mq_sockets			= [];										// socket connections to workers.
var buffer_size 		= 0;
var mps 						= 0;
var n 							= 0;


// Message Que, until downstream node has confirmed commitment.
var que 						= {};										// que messages in object by id for fast lookup.
var QUE_HWM					= 104857600;						// (bytes) high water mark for que, drop messages above this [104857600 = 100 MB].


// applies a nagle-ish algorithm (http://en.wikipedia.org/wiki/Nagle's_algorithm) for batching messages before sending to 0MQ/Axon.
// config['mq_nodelay'] = false, to apply this algorithm. When applyed speeds messages per seconds by 2 to 3 order of magnatude (~22k mps to ~90k mps).
var TCP_TRAIL_EXPIRES		= 200;				// Miliseconds, Timeout period for sending remaining messages.
var TCP_BUFFER_SIZE 		= 16450;				// Bytes, about TCP tuning see: http://pic.dhe.ibm.com/infocenter/aix/v6r1/index.jsp?topic=%2Fcom.ibm.aix.prftungd%2Fdoc%2Fprftungd%2Ftcp_streaming_workload_tuning.htm
	
var GUARANTEE_DELIVERY = false;		// feature in development, experimental, require('kurunt-axon') [https://github.com/markcode/kurunt-axon].


exports.init 				= init;
exports.push 				= push;


var processID = 0;
var pid = 0;

function init(_pid, topology) {

	pid = _pid;
	processID = config['name'] + '#' + pid;
	// NOTE must load workers first before connecting to axon inputs, else can recieve messages for processing before loading workers!!!

	// use topology to open each workers connection for axon.
	for ( var c = 0; c < topology['connections'].length; c++ ) {
		var apikey = topology['connections'][c]['apikey'];
		var namespace = topology['connections'][c]['namespace'];
		var zmq_pattern = topology['connections'][c]['zmq_pattern'];
		var zmq_address = topology['connections'][c]['zmq_address'];
		mq_sockets[c] = [];
		mq_sockets[c]['apikey'] = apikey;
		
		
		// if guaranteed delivery and pattern is push, change to req.
		if ( GUARANTEE_DELIVERY ) {
			if ( zmq_pattern === 'push' ) {
				zmq_pattern = 'req';
			}
			if ( zmq_pattern === 'pull' ) {
				zmq_pattern = 'rep';
			}			
		}
		console.log('messenger:'+processID+'@inputs> zmq_pattern: ' + zmq_pattern );
		
		
		mq_sockets[c]['socket'] = mq.socket(zmq_pattern);
		if ( topology['connections'][c]['zmq_socket'] == 'bind' ) {
			console.log('messenger:'+processID+"@inputs> zmq binding for apikey: " + apikey + ", namespace: " + namespace + ", at: " + zmq_pattern + "@" + zmq_address);
			mq_sockets[c]['socket'].bind(topology['connections'][c]['zmq_address']);
		} else {
			console.log('messenger:'+processID+"zmq connecting for apikey: " + apikey + ", namespace: " + namespace + ", at: " + zmq_pattern + "@" + zmq_address);
			mq_sockets[c]['socket'].connect(topology['connections'][c]['zmq_address']);	
		}
		
		mq_sockets[c]['socket'].on('disconnect', function(s){
			console.log('messenger:'+processID+"disconnected: " + s._peername.port);
				//console.log('> ' + util.inspect(msg, true, 99, true));
		});			
			
		mq_sockets[c]['socket'].format('json');	
		
			
		if ( GUARANTEE_DELIVERY ) {	
			mq_sockets[c]['socket'].set('guarantee_delivery', false);
			mq_sockets[c]['socket'].set('commits_hwm', 104857600);
			mq_sockets[c]['socket'].set('commits_timeout_resend', false);					
		}

	}
	
	setInterval(function () {		
		//debugger;
		console.log(processID + '@input> mps: ' + mps + ' n: ' + n + ' messages.length: ' + messages.length + ', bytes: ' + buffer_size  + ' qu: ' + mq_sockets[0]['socket'].queue.length);
		mps = 0;		// reset
	}, 1000);
	
}



var buffer 					= new Buffer(0);
var bufferLoop 			= new Buffer(0);
var messages 				= [];												// array of delineated buffer messages to send.

function push(apikey, worker, stores, tags, chunk) {

	//console.log('PUSH m: ' + Buffer.isBuffer(chunk) + ' len: ' + chunk.length +  ' messSt: ' + chunk.toString('ascii'));

	buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
	
	if ( buffer.length > config['chunk_buffer_limit'] ) {
		//throw new Error('Maximum chunk buffer size limit exceeded.');
		// should have handler so can drop chunks above HWM and continue.
		console.log('messenger:tcp@inputs> Warning: Maximum chunk buffer size limit exceeded, dropping buffer.');
		buffer = null;
		return false;
	}
	
	
	bufferLoop = null;
	bufferLoop = new Buffer(buffer.length);	
	bufferLoop = buffer;
	
	// examine chunk for individual messages.
	
	var esc = -99;		// reason for setting to -99 so wont trigger when i = 0 if esc here was also 0.
	var i = 0, x = 0;
	for (i = 0; i < bufferLoop.length; i++) {

  		// check if delineate is escaped. ascii 47 = / (escaped).
  		if ( bufferLoop.readUInt8(i) == 47 ) {
  			esc = i;
  		}
  		// delineate, config["message_delineate"] eg = 10 which is ascii for line feed: \n
  		if ( bufferLoop.readUInt8(i) == config["message_delineate"] && i != (esc + 1) ) {
  			//console.log('is delineate, at: ' + i + ' x: ' + x + ' messages.length: ' + messages.length);

				buffer = null;
				buffer = new Buffer(bufferLoop.length - (i + 1));
				buffer = bufferLoop.slice(i + 1);

				var m = bufferLoop.slice(x, i); 

				messages.push(m);												// add individual chunk into messages array.
				
				// add messaget to que.
				//que[	
				
				buffer_size += ( i - x );
				//config['mq_nodelay'] = true;
				if ( config['mq_nodelay'] === true ) {
			
					var msgs = messages;
					// reset messages buffer.
					messages = [];
					buffer_size = 0;
					//console.log('send, noDelay');
					send(msgs, apikey, worker, stores, tags, buffer_size, false);
					//send(msgs, buffer_size, false);								// send.
						
				} else {

					var nagleishTimeOut = undefined;
			 		// new (first in batch) chunk.
					if ( messages.length === 1 ) {
						//console.log('set nagleishTimeOut');
						// start nagleish delay timmer.
						nagleishTimeOut = (function () {
							setTimeout(function () {
								if ( buffer_size > 0 ) {
									var msgs = messages;
									// reset messages buffer.
									messages = [];
									buffer_size = 0;
									send(msgs, apikey, worker, stores, tags, buffer_size, true);				// send.
								}
							}, TCP_TRAIL_EXPIRES);
						})();	
					} 			
						
						
					if ( buffer_size > TCP_BUFFER_SIZE ) {
							clearTimeout(nagleishTimeOut);							// reset timer for timeout.
							var msgs = messages;
							// reset messages buffer.
							messages = [];
							buffer_size = 0;
							send(msgs, apikey, worker, stores, tags, buffer_size, false);							// send.
					}
				
				}
  			
  			x = i + 1;
  					
  			mps++;
  			n++;
  
  		}
	}

}



function send(m, apikey, worker, stores, tags, buffer_size, timedOut) {

//console.log('messenger:tcp@inputs> send');

	var mstime 			= Date.now();

	var sns = process.hrtime()[1].toString().substring(0,6);
	if ( sns.length < 6 ) {
		var s = sns.length;
		for (s = s; s < 6; s++) {
			sns = sns + '0';
		}
	}
		
	if ( timedOut === true ) {
		var ns = (mstime - TCP_TRAIL_EXPIRES).toString() + sns;				// nanoseconds (1 billionth of a second), eg: 1,367,990,421,008,301,995
	} else {
		var ns = mstime.toString() + sns;															// nanoseconds (1 billionth of a second), eg: 1,367,990,421,008,301,995
	}

	var idb = uidNumberBands.make(m.length);

	// form message object to send to the wire.
	var msg 				= {};
	msg.apikey 			= apikey;
	msg.input				= { "object": config['name'], "id": pid };	// use config or passed value.
	msg.worker 			= worker;
	msg.stores			= stores;
	//msg.reports			= reports;
	msg.tags				= tags;	
	msg.idb 				= idb;
	msg.ns 					= ns;
	msg.host				= config['admin_host'];
	msg.port				= config['admin_port'];
	msg.band 				= config['band'];
	msg.bands 			= config['bands'];
	msg.timedOut 		= timedOut;

	// now add messages array to msg obj for sending on the wire.
	msg.messages 		= m;								// here is where all the actual messages are.
	

	// for each worker this data is connected to, send to that worker (could be one or many).	
	for ( var c in mq_sockets ) {
		//if ( mq_sockets[c]['apikey'] == '*' || mq_sockets[c]['apikey'] == apikey ) {
			//console.log('sending msg to wire! timedOut: ' + timedOut + ' m.len: ' + m.length + ' idb: ' + idb);
			//console.log('sending for apikey: ' + apikey + ' on socket apikey: ' + mq_sockets[c]['apikey']);
			//mq_sockets[c]['socket'].send(codec.encode(msg));				// as msgpack.
			
//console.log('msg> ' + util.inspect(msg, true, 99, true));
			//	var mcodex = codec.encode(msg);

			mq_sockets[c]['socket'].send(msg);			
			
		//}
	}

}


