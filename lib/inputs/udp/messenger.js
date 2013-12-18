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


var util 						= require('util');
var lconfig					= require("./config.json");								// your local lconfig settings.
var gconfig					= require("../../.././config.json");								// your local lconfig settings.
var log 						= function(txt) { if ( gconfig['quiet'] === false ) { console.log(txt); } };

console.log('dir: ' + __dirname);

//var mq 							= require('../../../.././kurunt-axon');
var mq 							= require('axon');
var os 							= require('os')
var fs 							= require('fs');



var util 						= require('util');

var mq_sockets			= [];										// socket connections to workers.
var mps 						= 0;
var n 							= 0;


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
			console.log('messenger:'+processID + '@input> ' + "disconnected: " + s._peername.port);
				//console.log('> ' + util.inspect(msg, true, 99, true));
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
		console.log(processID + '@inputs> mps: ' + mps + ' n: ' + n + ' qu: ' + mq_sockets[0]['socket'].queue.length);
		mps = 0;		// reset
	}, 1000);
	
}


var buffer_size 		= [];												// array by apikey of size of messages in buffered.
var messages 				= [];												// array by apikey of delineated buffer messages to send.
var nagleishTimeOut = [];

function push(apikey, message, id) {


	
	// set arrays by apikey.
	if ( typeof messages[apikey] === 'undefined' ) {
		messages[apikey] = [];				// set array for this apikey (worker).
	}
	if ( typeof buffer_size[apikey] === 'undefined' ) {
		buffer_size[apikey] = 0;			// set size for this apikey (worker).
	}
	

				// can set additional message meta in msgObj here if want.
				var msgObj = {};
				msgObj.id = id;
				msgObj.message = message;
				
				
				messages[apikey].push(msgObj);		// push message into array by apikey (worker).

				buffer_size[apikey] += message.length;
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
  			

  					
  			mps++;
  			n++;
  


}




var streams = {};		// get dynamically set/unset by index.js through web admin.
exports.streams = streams;



function send(m, apikey, buffer_size, timedOut) {

	try {
		if ( streams[apikey].status === 'closed' ) {
			console.log('messenger:tcp@inputs> stream closed dont send');
			return false;
		}
	} catch(e) {
		return false;
	}

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

	var idb = m[0]['id']['uid'];		// use the first set message id as idb(atch).

	// get stream properties by apikey
	//console.log('messenger:tcp@inputs> apikey: ' + apikey + ':' + util.inspect(streams[apikey], true, 99, true));


	// form message object to send to the wire.
	var msg 				= {};
	msg.apikey 			= apikey;
	msg.input				= { "object": lconfig['name'], "id": pid, "hosts": this_hosts };	// use lconfig or passed value.
	msg.worker 			= streams[apikey].worker;
	msg.stores			= streams[apikey].stores;
	msg.tags				= streams[apikey].tags;
	//console.log('idb: ' + idb + ' mlen: ' + m.length);	
	msg.idb 				= idb;
	msg.ns 					= ns;
	msg.band 				= gconfig['band'];
	msg.bands 			= gconfig['bands'];
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
			if ( topology['connections'][c]['zmq_pattern'] === 'push' || topology['connections'][c]['zmq_pattern'] === 'req' || topology['connections'][c]['zmq_pattern'] === 'pub' ) {
				mq_sockets[c]['socket'].send(msg);
			}
			
		//}
	}

}


