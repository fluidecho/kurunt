//
// Kurunt Stream
//
// Stream
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// set config.
var l_config = require("./config.json"); try { var config = require("../../config.json"); } catch(e) { var config = require("./config.json"); } if ( l_config['run_standalone'] === true ) { var config = require("./config.json"); }


var version 			= 0.2;
var util 				= require('util');
var jsoncarrier 			= require('./jsoncarrier');								// delineate message chunks by linefeed (LF).
var fs 				= require('fs');										// to read/write indexs.json


var gconfig				= require("../../.././config.json");			// your global config settings.
var topology			= require("../../.././topology.json");



// messages rate, use this to know if should batch inserts into sphinx.
var mps 				= 0;												// message per second.
var n					= 0;
var batching_status 		= false;											// current batching status, updated every second.
var mp_proc 			= 0;



if ( l_config['run_standalone'] === true ) { _load(); }

_load();

var loaded = false;
// required "_load()" function.
function _load() {

	if ( config['run_standalone'] === true ) {
		// copyright statement.
		console.log('Welcome to Kurunt Stream (http://kurunt.org).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013 Mark W. B. Ashcroft.\nCopyright (c) 2013 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		console.log('*Loading Stream.');
	}




	
	for ( var p in topology.nodes[gconfig['this_node']].process ) {
		//console.log('p: ' + p + topology.nodes[gconfig['this_node']].process[p].object);
		if ( topology.nodes[gconfig['this_node']].process[p].object === 'store' && topology.nodes[gconfig['this_node']].process[p].namespace === 'stream' ) {
			console.log('stream@stores> Yes load this store with this topology!');
			topology = topology.nodes[gconfig['this_node']].process[p];
			break;
		}
	}






	var messages = jsoncarrier.parse(config);
	messages.on('message', function(message) {

		try {
			message.index = message.worker + '_' + message.apikey;
			//console.log('DUMP> ' + util.inspect(message, true, 99, true));
			
			// send message to each store
			// for each message.stores
				//send...
				
				
			mps++;
			n++;	
	
		} catch (e) {
			console.log('error: ' + e.message);
			//console.log('DUMP> ' + util.inspect(message, true, 99, true));
		}

	});


	setInterval(function () {
		console.log('stream> mps: ' + mps + ' n: ' + n);
		mps = 0;		// reset
	}, 1000);


	loaded = true; 

	console.log('stream> loaded');
} // end _load() function.



//




