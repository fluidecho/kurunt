//
// Kurunt Stream Store
//
// Stream Store
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config 			= require("./config.json");		// local config.
var streamapi 	= require("./api.js");				// stream api.

var version 		= 0.2;


// must export 'store' module.
module.exports.store = function (message, report, callback) {

  // See: http://docs.kurunt.com/stores/stream/

  console.log('stream@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
  	// send message to stream report for visulizing.
  	report.message(message);
  	
  	// send message to stream api.
  	streamapi.message(message);

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
    return callback( false );
  }

};

