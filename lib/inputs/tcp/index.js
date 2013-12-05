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
var gconfig				= require("../../.././config.json");			// your global config settings.
try {
	var streams				= require("../../.././streams.json");
} catch(e) {
	var streams = undefined;
}
var messenger     = require("./messenger");

var version 			= 0.2;																		// tcp input version number.

var server 				= require("./server");										// the tcp server.
var router 				= require("./router");										// routes the incomming messages by client connected.


var util 				= require('util');

var log 				= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

process.on('SIGINT', function() {
	console.log('tcp@inputs> SIGINT, exit.');
  process.exit(code=0);
});



var processID = 'tcp#' + process.pid;

// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log(processID + "@inputs>, process.on.message: " + util.inspect(m, true, 99, true));
	
	var init = false;
	
	var pid = 0;
	if ( m.id !== undefined ) {
		processID = 'tcp#' + m.id;
		pid = m.id;
	}
	if ( m.config !== undefined ) {
		gconfig = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	
	if ( m.newStream !== undefined ) {
		newStream(JSON.parse(m.newStream));
		return;
	}		
	
	if ( m.editStream !== undefined ) {
		editStream(JSON.parse(m.editStream));
		return;
	}	
		
	if ( init === false ) {
		init = true;		// has now initied dont call again.
		_init(pid, topology);
	}
});



exports._init 			= _init;
//exports.open			= open;
//exports.close			= close;
//exports.edit			= edit;

var server_started		= false;
var handle 				= {};



function _init(pid, topology) {

	console.log(config['name'] + '#' + pid + '@inputs> started.');

	messenger.init(pid, topology);

	startServer(pid, streams);
}


function startServer(pid, streams) {
	if ( streams == undefined ) {
		console.log(processID + "@inputs> TCP (input) '" + config['name'] + "' has no streams to open, goodbye.");
		if ( config['run_standalone'] === true ) {
			process.exit(0);  											// exit
		}
		return;														// return, do nada.
	}
	server_started = true;
	for ( var x = 0; x < streams['streams'].length; x++ ) {
		if ( streams['streams'][x]['status'] != 'closed' && streams['streams'][x]['input']['object'] === config['name'] && streams['streams'][x]['input']['id'] === pid ) {
			//clients[rAddress + ":" + rPort]['apikey'] = apikey;
			console.log(processID + "@inputs> Opening stream with apikey: " + streams['streams'][x]['apikey'] + " on port: " + streams['streams'][x]['apikey']);
			messenger.streams[streams['streams'][x]['apikey']] = streams['streams'][x];		// set within messenger so properties can be changed by admin.
			server.start(streams['streams'][x]['apikey'], streams['streams'][x]['worker'], streams['streams'][x]['stores'], streams['streams'][x]['tags'], router.route, messenger.push, streams['streams'][x]['access_hosts']);
		}
	}
	//server.start(streams, router.route, handle);
}



function newStream(stream) {
	//router.apikey_log[apikeyobj.apikey] = apikeyobj.apikey;
	//messenger.apikeys[apikeyobj.apikey] = apikeyobj;
	console.log(processID + "@inputs> newStream is opening a new apikey: " + stream['apikey'] + ".");
	console.log('processes stream> ' + util.inspect(stream, true, 99, true));
	//if ( server_started === false ) {
	//	server.start(router.route, handle);
	//}
	
	messenger.streams[stream['apikey']] = stream;
	
	console.log(processID + "@inputs> Opening stream with apikey: " + stream['apikey'] + " on port: " + stream['apikey']);
	server.start(stream['apikey'], stream['worker'], stream['stores'], stream['tags'], router.route, messenger.push, stream['access_hosts']);
	
	console.log('messenger.streams> ' + util.inspect(messenger.streams, true, 99, true));
	
}


function editStream(stream) {
	console.log(processID + "@inputs> editStream is editing apikey: " + stream['apikey'] + ".");
	messenger.streams[stream['apikey']] = stream;
	console.log('messenger.streams> ' + util.inspect(messenger.streams, true, 99, true));
	
	if ( stream['status'] === 'open' ) {
		console.log(processID + "@inputs> Opening stream with apikey: " + stream['apikey'] + " on port: " + stream['apikey']);
		server.start(stream['apikey'], stream['worker'], stream['stores'], stream['tags'], router.route, messenger.push, stream['access_hosts']);		
	} else {
		// close connected clients to this stream.
		close_clients(stream['apikey']);
		// close the stream.
		close_stream(stream['apikey']);
	}
	
}



function close_stream(apikey) {
	console.log(processID + "@inputs> closing server (stream) using apikey: " + apikey + ".");
	server.servers[apikey].close();					// close the 'stream's server connection.
	delete server.servers[apikey];		
}


function close_clients(apikey) {
	//delete router.apikey_log[apikey];
	// need to do more then just delete the apikey from list need to force close the connection if open to client.
	for (var c in server.clients) {
		if ( server.clients[c]['apikey'] === apikey ) {
			console.log(processID + "@inputs> closing client connected on apikey: " + apikey + ".");
			try {
				server.clients[c]['socket'].end();					// attemps to close connection.
				server.clients[c]['socket'].destroy();			// distroy ensures client disconnected.
				delete server.clients[c];
			} catch(e) {
			}
		}
	}
	
 	
 	/*
 	var x = 0;
	for (var k in router.apikey_log) {
		if (router.apikey_log.hasOwnProperty(k)) {
		   x++;
		}
	}
	if ( x == 0 ) {
		server_started = false;
		server.stop();
	}
	*/
	
}

