//
// TCP Input
//
// TCP input server for tcp clients like syslog.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config				= require("./config.json");								// your local input config settings.

try {
	var streams				= require("../../.././streams.json");
} catch(e) {
	var streams = undefined;
}
var messenger     = require("./messenger");

var version 			= 0.2;																		// tcp input version number.

var server 				= require("./server");										// the tcp server.
var router 				= require("./router");										// routes the incomming messages by client connected.


var logging = require('../.././logging');


process.on('uncaughtException', function (err) {
	process.send({ error: err.stack });
});	

process.on('SIGINT', function() {
	//logging.log(processID + '@inputs> SIGINT, exit.');
  process.exit(code=0);
});



var processID = 'tcp#' + process.pid;
var pid = 0;

// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	logging.log(processID + "@inputs>, process.on.message: ", m);
	
	var init = false;
	
	
	if ( m.id !== undefined ) {
		processID = 'tcp#' + m.id;
		pid = m.id;
	}
	if ( m.config !== undefined ) {
		//gconfig = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	
	// NOTE: about messenger.streams and server.start, if apikey is port then is set as number not string.
	if ( m.newStream !== undefined ) {
		newStream(JSON.parse(m.newStream));
		return;
	}		
	
	if ( m.editStream !== undefined ) {
		editStream(JSON.parse(m.editStream));
		return;
	}	
	
	if ( m.deleteStream !== undefined ) {
		deleteStream(m.deleteStream);
		return;
	}		
		
	if ( init === false ) {
		init = true;		// has now initied dont call again.
		_init(pid, topology);
	}
});



exports._init 			= _init;


var server_started		= false;
var handle 				= {};



function _init(pid, topology) {

	logging.log(config['name'] + '#' + pid + '@inputs> started.');

	messenger.init(pid, topology);

	startServer(pid, streams);
}


function startServer(pid, streams) {
	if ( streams == undefined ) {
		logging.log(processID + "@inputs> TCP (input) '" + config['name'] + "' has no streams to open, goodbye.");
		streams = {};
		streams.streams = [];
	}
	server_started = true;
	for ( var x = 0; x < streams['streams'].length; x++ ) {
		if ( streams['streams'][x]['status'] != 'closed' && streams['streams'][x]['input']['object'] === config['name'] && streams['streams'][x]['input']['id'] === pid ) {
			
			//clients[rAddress + ":" + rPort]['apikey'] = apikey;
			logging.log(processID + "@inputs> Opening stream with apikey: " + streams['streams'][x]['apikey'] + " on port: " + streams['streams'][x]['apikey']);
			messenger.streams[streams['streams'][x]['apikey']] = streams['streams'][x];		// set within messenger so properties can be changed by admin.
			server.start(streams['streams'][x]['apikey'], router.route, messenger.push, messenger.streams);
		}
	}
	process.send({ object: 'input', namespace: 'tcp', message: 'loaded' });
}


function newStream(stream) {
	
	if ( messenger.streams[stream['apikey']] != undefined ) {
		delete messenger.streams[apikey];
	}	
	
	
	if ( stream['status'] === 'open' && stream['input']['object'] === config['name'] && stream['input']['id'] === pid ) {	
		messenger.streams[stream['apikey']] = stream;
	
		logging.log(processID + "@inputs> Opening stream with apikey: " + stream['apikey'] + " on port: " + stream['apikey']);
		server.start(stream['apikey'], router.route, messenger.push, messenger.streams);
	
		//logging.log(processID + '@inputs> messenger.streams ', messenger.streams);
	}
	
}


function editStream(stream) {
	//console.log(processID + "@inputs> editStream is editing apikey: " + stream['apikey'] + ".");
	//console.log(processID + '@inputs> messenger.streams ' + util.inspect(messenger.streams, true, 99, true));

	messenger.streams[stream['apikey']] = stream;

	if ( stream['status'] === 'open' && stream['input']['object'] === config['name'] && stream['input']['id'] === pid ) {	
		
		if ( server.servers[stream['apikey']] === undefined ) {
			logging.log(processID + "@inputs> Opening stream with apikey: " + stream['apikey'] + " on port: " + stream['apikey']);
			server.start(stream['apikey'], router.route, messenger.push, messenger.streams);
		}
	} else {
		// close connected clients to this stream.
		close_clients(stream['apikey']);
		// close the stream.
		close_stream(stream['apikey']);
	}
	
}


function close_clients(apikey) {
	//delete router.apikey_log[apikey];
	// need to do more then just delete the apikey from list need to force close the connection if open to client.
	for (var c in server.clients) {
		if ( server.clients[c]['apikey'] === apikey ) {
			logging.log(processID + "@inputs> closing client connected on apikey: " + apikey + ".");
			try {
				server.clients[c]['socket'].end();					// attemps to close connection.
				server.clients[c]['socket'].destroy();			// distroy ensures client disconnected.
				delete server.clients[c];
			} catch(e) {
			}
		}
	}
}


function deleteStream(apikey) {
	logging.log(processID + "@inputs> deleteStream is deleting apikey: " + apikey + ".");
	try {
		// set status to closed before deleting.
		messenger.streams[apikey].status = 'closed';
		// close connected clients to this stream.
		close_clients(apikey);
		// close the stream.
		close_stream(apikey);
	
		delete messenger.streams[apikey];
	} catch(e) {
	}		
}


function close_stream(apikey) {
	logging.log(processID + "@inputs> closing server (stream) using apikey: " + apikey + ".");
	try {
		server.servers[apikey].close();					// close the 'stream's server connection.
		delete server.servers[apikey];
		delete messenger.streams[apikey];
	} catch(e) {
	}	
}

