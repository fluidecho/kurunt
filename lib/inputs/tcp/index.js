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
var streams				= require("../../.././streams.json");
var messenger     = require("./messenger");

var version 			= 0.2;																		// tcp input version number.

var server 				= require("./server");										// the tcp server.
var router 				= require("./router");										// routes the incomming messages by client connected.


var util 				= require('util');

var log 				= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

process.on('SIGINT', function() {
	console.log('tcp@input> SIGINT, exit.');
  process.exit(code=0);
});



var processID = 'tcp#' + process.pid;

// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log('*workers, process.on.message>' + util.inspect(m, true, 99, true));
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
	_init(pid, topology);
});



exports._init 			= _init;
exports.open			= open;
exports.close			= close;

var server_started		= false;
var handle 				= {};



function _init(pid, topology) {

	console.log(config['name'] + '#' + pid + '@input> started.');

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
			server.start(streams['streams'][x]['apikey'], streams['streams'][x]['worker'], streams['streams'][x]['stores'], streams['streams'][x]['tags'], router.route, messenger.push, streams['streams'][x]['access_hosts']);
		}
	}
	//server.start(streams, router.route, handle);
}



function open(apikeyobj) {
	router.apikey_log[apikeyobj.apikey] = apikeyobj.apikey;
	messenger.apikeys[apikeyobj.apikey] = apikeyobj;
	console.log(processID + "@inputs> TCP (input) '" + config['name'] + "' Server has opened a new apikey: " + apikey + ".");
	if ( server_started === false ) {
		server.start(router.route, handle);
	}
}


function close(apikey) {
	delete router.apikey_log[apikey];
	// need to do more then just delete the apikey from list need to force close the connection if open to client.
	for (var c in server.clients) {
		if ( server.clients[c]['name'] == apikey ) {
			server.clients[c]['socket'].end();
		}
	}
	log("TCP (input) '" + config['name'] + "' Server has closed apikey: " + apikey + ".");
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
}
