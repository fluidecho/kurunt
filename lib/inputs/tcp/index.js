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
var data				= require("../../.././data.json");

var version 			= 0.2;																		// tcp input version number.

var server 				= require("./server");										// the tcp server.
var router 				= require("./router");										// routes the incomming messages by client connected.
var messenger			= require("./messenger");
var topology			= require("../../.././topology.json");

var util 				= require('util');

var log 				= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

process.on('SIGINT', function() {
	console.log('tcp@input> SIGINT, stoping.');
  process.exit(0);
});


//
// required functions		:-
//
// _load				: called when kurunt starts (always).
// open				: called when kurunt creates a new data input.
// close				: called when kurunt close the data input.
//
// exposes functions		:
exports._load 			= _load;
exports.open			= open;
exports.close			= close;

var server_started		= false;
var handle 				= {};


// does this app run standalone or as a module?
var running_standalone = true;	// false = required as a module.
process.argv.forEach(function(val, index, array) {
	if ( val === 'forked' ) {
		console.log("I'm forked not standalone.");
		// load topology.json from admin.
		running_standalone = false;
		_load();
	}
});

if ( running_standalone === true ) {
	_load();	// loaded directly
}

/*

if ( require.main === module ) {
	console.log("called directly");
	running_standalone = true;
	this._load();
} else {
	console.log("required as a module");
}
*/


function _load() {

	if ( running_standalone === true ) {
		// copyright statement.
		console.log('Welcome to TCP Server (input) (http://kurunt.com).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013 Mark W. B. Ashcroft.\nCopyright (c) 2013 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		console.log('tcp@input> started.');
	}
	
	//console.log('topology> ' + util.inspect(topology.nodes[gconfig['this_node']].process, true, 99, true));
	
	
	for ( var p in topology.nodes[gconfig['this_node']].process ) {
		//console.log('p: ' + p + topology.nodes[gconfig['this_node']].process[p].object);
		if ( topology.nodes[gconfig['this_node']].process[p].object === 'input' && topology.nodes[gconfig['this_node']].process[p].namespace === 'tcp' ) {
			//console.log('tcp@inputs> Yes load this input with this topology!');
			topology = topology.nodes[gconfig['this_node']].process[p];
			break;
		}
	}
	
	/*
	// set topology for this 'process'
	for ( var p in topology.nodes[gconfig['this_node']].process ) {
		if ( topology.nodes[gconfig['this_node']].process[p].object === 'input' && topology.nodes[gconfig['this_node']].process[p].namespace === 'tcp' ) {
			topology = topology.nodes[gconfig['this_node']].process[p];
			break;
		}
	}
	*/

	messenger.init(topology);	


	if ( config['open_inputs_via_admin'] === true ) {
		console.log("tcp@inputs> TCP (input) open_inputs_via_admin");
	} else {
		startServer(data);
	}	

}


function startServer(open_data) {
	if ( open_data == undefined ) {
		console.log("tcp@inputs> TCP (input) '" + config['name'] + "' has no apikeys to open, goodbye.");
		if ( config['run_standalone'] === true ) {
			process.exit(0);  											// exit
		}
		return;														// return, do nada.
	}
	server_started = true;
	for ( var x = 0; x < open_data['data'].length; x++ ) {
		if ( open_data['data'][x]['status'] != 'closed' ) {
			//clients[rAddress + ":" + rPort]['apikey'] = apikey;
			console.log("tcp@inputs> Opening data with apikey: " + open_data['data'][x]['apikey'] + " on port: " + open_data['data'][x]['port']);
			server.start(open_data['data'][x]['port'], open_data['data'][x]['apikey'], open_data['data'][x]['worker'], open_data['data'][x]['stores'], open_data['data'][x]['tags'], router.route);
		}
	}
	//server.start(open_data, router.route, handle);
}



function open(apikeyobj) {
	router.apikey_log[apikeyobj.apikey] = apikeyobj.apikey;
	messenger.apikeys[apikeyobj.apikey] = apikeyobj;
	console.log("tcp@inputs> TCP (input) '" + config['name'] + "' Server has opened a new apikey: " + apikey + ".");
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
