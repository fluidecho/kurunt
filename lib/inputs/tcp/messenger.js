//
// Messenger (inputs)
//
// Queue and send messages via TCP to Kurunt workers.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


var lconfig					= require("./config.json");								// your local lconfig settings.
var gconfig					= require("../../.././config.json");								// your local lconfig settings.


var logging = require('../.././logging');


//var mq 							= require('../../../.././kurunt-axon');
var mq 							= require('axon');
var os 							= require('os')
var fs 							= require('fs');


var uidNumberBands 	= require('uid-number-bands');
uidNumberBands.init(gconfig['band'], gconfig['bands'], true);		// start ids at 1 not 0.


var mq_sockets			= [];										// socket connections to workers.
var mps 						= 0;
var n 							= 0;
var msize						= 0;		// the total (cumulative) byte size inputed (for benchmarking).

// Message Que, until downstream node has confirmed commitment.
var que 						= {};										// que messages in object by id for fast lookup.
//var QUE_HWM					= 104857600;						// (bytes) high water mark for que, drop messages above this [104857600 = 100 MB].

// applies a nagle-ish algorithm (http://en.wikipedia.org/wiki/Nagle's_algorithm) for batching messages before sending to 0MQ/Axon.
// lconfig['mq_nodelay'] = false, to apply this algorithm. When applyed speeds messages per seconds by 2 to 3 order of magnatude (~22k mps to ~90k mps).
var TCP_TRAIL_EXPIRES		= 200;				// Miliseconds, Timeout period for sending remaining messages.
var TCP_BUFFER_SIZE 		= 16450;				// Bytes, about TCP tuning see: http://pic.dhe.ibm.com/infocenter/aix/v6r1/index.jsp?topic=%2Fcom.ibm.aix.prftungd%2Fdoc%2Fprftungd%2Ftcp_streaming_workload_tuning.htm
	
var GUARANTEE_DELIVERY = false;		// feature in development, experimental, require('kurunt-axon') [https://github.com/markcode/kurunt-axon].


exports.init 				= init;
exports.push 				= push;


var processID = 0;
var pid = 0;
var this_hosts = ['127.0.0.1'];


function init(_pid, topology) {

	pid = _pid;
	processID = lconfig['name'] + '#' + pid;
	// NOTE must load workers first before connecting to axon inputs, else can recieve messages for processing before loading workers!!!

	// get this host ip, for adding to message meta.
	var interfaces = os.networkInterfaces();
	for (k in interfaces) {
		for (k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family == 'IPv4' && !address.internal) {
				this_hosts.push(address.address);
			}
		}
	}

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
		logging.log('messenger:'+processID+'@inputs> zmq_pattern: ' + zmq_pattern );
		
		
		mq_sockets[c]['socket'] = mq.socket(zmq_pattern);
		if ( topology['connections'][c]['zmq_socket'] == 'bind' ) {
			logging.log('messenger:'+processID+"@inputs> zmq binding for apikey: " + apikey + ", namespace: " + namespace + ", at: " + zmq_pattern + "@" + zmq_address);
			mq_sockets[c]['socket'].bind(topology['connections'][c]['zmq_address']);
		} else {
			logging.log('messenger:'+processID+"zmq connecting for apikey: " + apikey + ", namespace: " + namespace + ", at: " + zmq_pattern + "@" + zmq_address);
			mq_sockets[c]['socket'].connect(topology['connections'][c]['zmq_address']);	
		}
		
		mq_sockets[c]['socket'].on('disconnect', function(s){
			logging.log('messenger:'+processID + '@input> ' + "disconnected: " + s._peername.port);
		});			
		
		// TODO: future feature.
		if ( GUARANTEE_DELIVERY ) {	
			mq_sockets[c]['socket'].set('guarantee_delivery', false);
			mq_sockets[c]['socket'].set('commits_hwm', QUE_HWM);
			mq_sockets[c]['socket'].set('commits_timeout_resend', false);					
		}
		
		mq_sockets[c]['socket'].format('json');	
		//mq_sockets[c]['socket'].set('hwm', QUE_HWM);		// TODO: future feature

/*
		// TODO: future feature, have axon set hwm by bytes not message number, need good way to manage socket reconnection if sockets changed in topologoy and not to flood axon in recursive way. 
		// event if HWM exceeded then save messages to disk.
		mq_sockets[c]['socket'].on('drop', function(msg){
			console.log(processID + '@input> HWM start saving to disk - n: ' + n + ' messages.length: ' + messages.length + ', bytes: ' + buffer_size  + ' qu: ' + mq_sockets[0]['socket'].queue.length);
			// save to disk.
			fs.appendFile('flood.log', JSON.stringify(msg) + '\n', function (err) {
				if (err) throw err;
				console.log('The "data to append" was appended to file!');
			});
		});

		// event if socket reconnected and sends all queud messages, open flood.log and re-send.
		mq_sockets[c]['socket'].on('flush', function(msg){
			// read flood.log and re-send
		});	
*/


	}	// for each socket.
	
	

	
	
	setInterval(function () {		
		//debugger;
		//console.log('msg> ' + util.inspect(mq_sockets[0]['socket'], true, 99, true))
		//console.log(processID + '@input> mps: ' + mps + ' n: ' + n + ' messages.length: ' + messages.length + ', bytes: ' + buffer_size  + ' qu: ' + mq_sockets[0]['socket'].queue.length);
		// + ' qu: ' + mq_sockets[0]['socket'].queue.length
		logging.benchmark(processID + '@inputs> mps: ' + mps + ' n: ' + n + ' msize: ' + msize);
		mps = 0;		// reset
	}, 1000);
	
}



var buffer 					= new Buffer(0);
var bufferLoop 			= new Buffer(0);
var buffer_size 		= [];												// array by apikey of size of messages in buffered.
var messages 				= [];												// array by apikey of delineated buffer messages to send.
var nagleishTimeOut = [];

function push(apikey, chunk) {

	//console.log('PUSH m: ' + Buffer.isBuffer(chunk) + ' len: ' + chunk.length +  ' messSt: ' + chunk.toString('ascii'));

	buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
	
	if ( buffer.length > lconfig['chunk_buffer_limit'] ) {
		//throw new Error('Maximum chunk buffer size limit exceeded.');
		// should have handler so can drop chunks above HWM and continue.
		logging.log('messenger:tcp@inputs> Warning: Maximum chunk buffer size limit exceeded, dropping buffer.');
		buffer = null;
		return false;
	}
	
	
	// set arrays by apikey.
	if ( typeof messages[apikey] === 'undefined' ) {
		messages[apikey] = [];				// set array for this apikey (worker).
	}
	if ( typeof buffer_size[apikey] === 'undefined' ) {
		buffer_size[apikey] = 0;			// set size for this apikey (worker).
	}
	
	//if ( gconfig['logging'] === 'benchmark' || gconfig['logging'] === 'debug' ) {
	//	msize += chunk.length;
	//}
	
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
  		// delineate, lconfig["message_delineate"] eg = 10 which is ascii for line feed: \n
  		if ( bufferLoop.readUInt8(i) == lconfig["message_delineate"] && i != (esc + 1) ) {
  			//console.log('is delineate, at: ' + i + ' x: ' + x + ' messages.length: ' + messages.length);

				buffer = null;
				buffer = new Buffer(bufferLoop.length - (i + 1));
				buffer = bufferLoop.slice(i + 1);

				var m = bufferLoop.slice(x, i); 

				// can set additional message meta in msgObj if want.
				var msgObj = {};
				// NOTE: tcp does not set individual message id's (unlike udp, http inputs) just idb.
				msgObj.message = m;		// the actual message buffer.

				messages[apikey].push(msgObj);		// push message into array by apikey (worker).

				buffer_size[apikey] += ( i - x );
				//lconfig['mq_nodelay'] = true;
				if ( gconfig['mq_nodelay'] === true ) {
			
					var msgs = messages[apikey];
					messages[apikey] = [];
					buffer_size[apikey] = 0;
					send(msgs, apikey, buffer_size[apikey], false);
						
				} else {
					
					nagleishTimeOut[apikey] = undefined;
			 		// new (first in batch) chunk.
					if ( messages[apikey].length === 1 ) {
						//console.log('set nagleishTimeOut');
						// start nagleish delay timmer.
						nagleishTimeOut[apikey] = (function () {
							setTimeout(function () {
								if ( buffer_size[apikey] > 0 ) {
									var msgs = messages[apikey];
									// reset messages buffer.
									messages[apikey] = [];
									buffer_size[apikey] = 0;
									send(msgs, apikey, buffer_size[apikey], true);				// send.
								}
							}, TCP_TRAIL_EXPIRES);
						})();	
					}
						
					if ( buffer_size[apikey] > TCP_BUFFER_SIZE ) {
							clearTimeout(nagleishTimeOut[apikey]);							// reset timer for timeout.
							var msgs = messages[apikey];
							// reset messages buffer.
							messages[apikey] = [];
							buffer_size[apikey] = 0;
							send(msgs, apikey, buffer_size[apikey], false);							// send.
					}
				
				}
  			
  			x = i + 1;
  					
  			mps++;
  			n++;
  
  		}
	}

}




var streams = {};		// get dynamically set/unset by index.js through web admin.
exports.streams = streams;



function send(m, apikey, buffer_size, timedOut) {

	try {
		if ( streams[apikey].status === 'closed' ) {
			logging.log('messenger:tcp@inputs> stream closed dont send');
			return false;
		}
	} catch(e) {
		return false;
	}

	logging.log('messenger:tcp@inputs> send');

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

	var idb = uidNumberBands.make(m.length).uid;

	// get stream properties by apikey
	logging.log('messenger:tcp@inputs> apikey: ' + apikey, streams[apikey]);

	// form message object to send to the wire.
	var msg 				= {};
	msg.apikey 			= apikey;
	msg.input				= { "object": lconfig['name'], "id": pid, "hosts": this_hosts };	// use lconfig or passed value.
	msg.worker 			= streams[apikey].worker;
	msg.stores			= streams[apikey].stores;
	msg.tags				= streams[apikey].tags;
	msg.idb 				= idb;
	msg.ns 					= ns;
	msg.band 				= gconfig['band'];
	msg.bands 			= gconfig['bands'];
	msg.timedOut 		= timedOut;

	// now add messages array to msg obj for sending on the wire.
	msg.messages 		= m;								// here is where all the actual messages are.
	
	// for each worker this data is connected to, send to that worker (could be one or many).	
	for ( var c in mq_sockets ) {
		logging.log(processID + '@inputs> sending msg to wire! apikey: ' + apikey + ' timedOut: ' + timedOut + ' m.len: ' + m.length + ' idb: ' + idb);
		if ( topology['connections'][c]['zmq_pattern'] === 'push' || topology['connections'][c]['zmq_pattern'] === 'req' || topology['connections'][c]['zmq_pattern'] === 'pub' ) {
			mq_sockets[c]['socket'].send(msg);
		}
	}

}

