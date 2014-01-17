//
// Kurunt Stream Store
//
// Stream Store
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var config = require("./config.json");    // local config.
exports.config = config;		// must export the config so kurunt can read it.


var streamapi = undefined;
var streamreport = undefined;

module.exports.init = function (pid) {
	streamapi = require("./api.js");				// stream api.

	streamreport = require('../../reports/stream/./index.js');
	streamreport.init(pid);
	var this_config = require('../../reports/stream/./config.json');
	//console.log('stream@stores> report to load: ' + this_config['title']);	
};



var version 		= 0.2;


// must export 'store' module.
module.exports.store = function (message, callback) {

  // See: http://docs.kurunt.com/Stream_Store

  //console.log('stream@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
		// send message to stream report for visulizing.
		streamreport.message(message, function(err) {
			// garbage collector.
		});
	
  	// send message to stream api.
  	streamapi.message(message, function(err) {
			// garbage collector.
		});

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
  	console.log('stream@stores, ERROR> ' + e);    // uncomment to debug message.
  	throw e;
    //return callback( false );
  }

};



