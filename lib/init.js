//
// Init(iate)
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



// load dependencies.
var util 			= require('util');
var fs 				= require('fs');

var version		= "0.2.2";


exports.init 	= init;


function init(kurunt, config, topology, workers, stores, callback) {

	// display if running stand-alone.
	if ( workers === undefined && stores === undefined ) {
		// Copyright Statement - DO NOT EDIT OR REMOVE AS REQUIRED BY LICENSE.
		console.log('Welcome to Kurunt (http://kurunt.com).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013-2014 Mark W. B. Ashcroft.\nCopyright (c) 2013-2014 Kurunt.\n');
	}
	
	// based on topology launch inputs, schemas, stores nodes.
	// launch topology.
	var Topo 					= require('./topology.js');
	Topo.topo(kurunt, config, topology, workers, stores, function(err, xprocesses) {
		//console.log('init.js> xprocesses: ' + require('util').inspect(xprocesses, true, 99, true));
		return callback( err, xprocesses );		// returns processes falked.
		//return callback( Topo.processes );		// returns processes falked.
	});
	
}

