//
// Init(iate)
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
var fs 							= require('fs');

var version					= 0.2;



exports.init 				= init;





function init(config, streams, topology) {

	// copyright statement.
	console.log('Welcome to Kurunt (http://kurunt.com).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013 Mark W. B. Ashcroft.\nCopyright (c) 2013 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');

	// based on topology launch inputs, schemas, stores nodes.
	// launch topology.
	var Topo 					= require('./topology.js');
	Topo.topo(config, topology);


	//cb(null, streams, topology, config);

	return true;

}








