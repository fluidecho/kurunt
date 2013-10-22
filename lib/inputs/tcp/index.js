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
var data					= require("../../.././data.json");

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


exports._init 			= _init;
exports.open			= open;
exports.close			= close;

var server_started		= false;
var handle 				= {};



function _init(pid, messenger) {

	processID =  config['name'] + '#' + pid;

	console.log(processID + '@input> started.');

	startServer(messenger, data);
}


function startServer(messenger, open_data) {
	if ( open_data == undefined ) {
		console.log(processID + "@inputs> TCP (input) '" + config['name'] + "' has no apikeys to open, goodbye.");
		if ( config['run_standalone'] === true ) {
			process.exit(0);  											// exit
		}
		return;														// return, do nada.
	}
	server_started = true;
	for ( var x = 0; x < open_data['data'].length; x++ ) {
		if ( open_data['data'][x]['status'] != 'closed' && open_data['data'][x]['input'] === config['name'] ) {
			//clients[rAddress + ":" + rPort]['apikey'] = apikey;
			console.log(processID + "@inputs> Opening data with apikey: " + open_data['data'][x]['apikey'] + " on port: " + open_data['data'][x]['port']);
			server.start(messenger, open_data['data'][x]['port'], open_data['data'][x]['apikey'], open_data['data'][x]['worker'], open_data['data'][x]['stores'], open_data['data'][x]['tags'], router.route);
		}
	}
	//server.start(open_data, router.route, handle);
}



function open(apikeyobj) {
	router.apikey_log[apikeyobj.apikey] = apikeyobj.apikey;
	messenger.apikeys[apikeyobj.apikey] = apikeyobj;
	console.log(processID + "@inputs> TCP (input) '" + config['name'] + "' Server has opened a new apikey: " + apikey + ".");
	if ( server_started === false ) {
		server.start(messenger, router.route, handle);
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
