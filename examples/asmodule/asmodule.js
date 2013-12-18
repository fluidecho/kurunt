//
// Kurunt, As Module
//
// Using Kurunt as a module framework, rather than stand-alone.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var Kurunt    		= require("../");		// call the Kurunt module [require('kurunt')].
var config    		= require(".././config.json");
var topology  		= require(".././topology.json");

var workers 			= {};
workers.myworker 	= __dirname + '/myworker.js';		// full path to your worker function.

var stores 				= {};
stores.mystore 		= __dirname + '/mystore.js';		// full path to your store function.


// init: {config}, {topology}, {workers}, {stores}, (callback function).
Kurunt.init(config, topology, workers, stores, function(kurunt) {

	// form new stream.
	var tags = ['test', 'asmodule'];
	var access_hosts = [];
	var use_stores = ['mystore', 'stream'];		// have set mystore as set above, as well as stream so can view in 'Stream Report'.

	// newStream: input, worker, [stores], [tags], [access_hosts], (callback function).
	kurunt.newStream('tcp', 'myworker', use_stores, tags, access_hosts, function(stream) {
		//console.log('asmodule.js> stream: ' + require('util').inspect(stream, true, 99, true));    // uncomment to debug stream.
		
		// can now form and send my message into the stream.
		var mymessage = {};		// will send this message in JSON, as that is the format myworker.js is expecting.
		mymessage.hello = 'world';
		mymessage.num = 101;
		mymessage.fab = true;
		
		// send this message into the stream.
		kurunt.send(stream, JSON.stringify(mymessage), function (e, sent) {
			console.log('asmodule.js> sent message: ' + sent);
		});
		
	});

});

