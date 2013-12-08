//
// HTTP Input
//
// HTTP input server.
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
	console.log(processID + '@inputs> SIGINT, exit.');
  process.exit(code=0);
});



var processID = 'http#' + process.pid;
var pid = 0;

// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log(processID + "@inputs>, process.on.message: " + util.inspect(m, true, 99, true));
	
	var init = false;
	
	
	if ( m.id !== undefined ) {
		processID = 'http#' + m.id;
		pid = m.id;
	}
	if ( m.config !== undefined ) {
		gconfig = JSON.parse(m.config);
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
		console.log(processID + "@inputs> HTTP (input) '" + config['name'] + "' has no streams to open, goodbye.");
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
			//server.start(processID, streams['streams'][x]['apikey'], router.route, messenger.push, messenger.streams);
		}
	}

	server.start(processID, router.route, messenger.push, messenger.streams);
	
}


function newStream(stream) {
return;
	//console.log(processID + "@inputs> newStream for apikey: " + stream['apikey'] + ".");
	//console.log(processID + '@inputs> stream: ' + util.inspect(stream, true, 99, true));
	//console.log(processID + '@inputs> name: ' + config['name']);
	if ( stream['status'] === 'open' && stream['input']['object'] === config['name'] && stream['input']['id'] === pid ) {	
		messenger.streams[stream['apikey']] = stream;
		console.log(processID + "@inputs> Opening stream with apikey: " + stream['apikey'] + " on port: " + stream['apikey']);
		server.start(processID, stream['apikey'], router.route, messenger.push, messenger.streams);
		console.log(processID + '@inputs> messenger.streams: ' + util.inspect(messenger.streams, true, 99, true));
	}
}


function editStream(stream) {
return;
	//console.log(processID + "@inputs> editStream is editing apikey: " + stream['apikey'] + ".");
	//console.log(processID + '@inputs> messenger.streams: ' + util.inspect(messenger.streams, true, 99, true));
	messenger.streams[stream['apikey']] = stream;

	if ( stream['status'] === 'open' && stream['input']['object'] === config['name'] && stream['input']['id'] === pid ) {	
		
		if ( server.servers[stream['apikey']] === undefined ) {
			console.log(processID + "@inputs> Opening stream with apikey: " + stream['apikey'] + " on port: " + stream['apikey']);
			server.start(processID, stream['apikey'], router.route, messenger.push, messenger.streams);
		}
	} else {
		// close the stream.
		close_stream(stream['apikey']);
	}
	
}




function deleteStream(apikey) {
	console.log(processID + "@inputs> deleteStream is deleting apikey: " + apikey + ".");
	return;
	try {
		// set status to closed before deleting.
		messenger.streams[apikey].status = 'closed';

		// close the stream.
		close_stream(apikey);
	
		delete messenger.streams[apikey];
	} catch(e) {
	}		
}


function close_stream(apikey) {
	console.log(processID + "@inputs> closing server (stream) using apikey: " + apikey + ".");
	try {
		server.servers[apikey].close();					// close the 'stream's server connection.
		delete server.servers[apikey];
		delete messenger.streams[apikey];
	} catch(e) {
	}	
}




