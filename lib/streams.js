//
// Data
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



// load dependencies.
var util 						= require('util');
var fs 						= require('fs');


exports._getStreams					= _getStreams;




function _getStreams(config, cb) { 
	//config.xlog('loading data');

	try {
		var streams 					= require('.././streams.json');
	} catch(e) {
		var streams = undefined;
	}
	

	//console.log('streams> ' + util.inspect(streams, true, 99, true));
	cb(streams);
	return true;

	
}


function _newStream(config, nodes, inputs, worker, stores, tags, access_hosts, cb) { 
	//config.xlog('loading data');

	try {
		var streams 					= require('.././streams.json');
	} catch(e) {
		var streams = undefined;
	}
	

	//console.log('streams> ' + util.inspect(streams, true, 99, true));
	cb(streams);
	return true;

	
}



function _saveStream(config, cb) { 
	config.xlog('saving streams to streams.json');

	//var streams 					= require('.././streams.json');

	//console.log('streams> ' + util.inspect(streams, true, 99, true));
	cb(streams);
	return true;

	
}





