#!/usr/bin/env node
//
// Kurunt CLI (bin executable app)
//
// Scalable Message Processing Framework.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var Kurunt    	= require("../");		// call the Kurunt module [require('kurunt')].
var config    	= require(".././config.json");
try {
	var streams   = require(".././streams.json");
} catch(e) {
	var streams 	= undefined;
}
var topology  	= require(".././topology.json");



// _.init: {config}, {topology}, {workers}, {stores}, (callback function).
Kurunt.init(config, topology, undefined, undefined, function(kurunt) {

	//console.log('cli.js> kurunt: ' + require('util').inspect(stream, true, 99, true));    // uncomment to debug.

});

