#!/usr/bin/env node
//
// Kurunt CLI (bin executable app)
//
// Scalable Message Processing Framework.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var Kurunt    	= require("../");		// call the Kurunt module [require('kurunt')].


// init: [workers], [stores], (callback function).
Kurunt.init(undefined, undefined, function(kurunt) {
	//console.log('cli.js> kurunt: ' + require('util').inspect(kurunt, true, 99, true));    // uncomment to debug.
});

