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


// set config.
var l_config = require("./config.json"); try { var config = require("../../config.json"); } catch(e) { var config = require("./config.json"); } if ( l_config['run_standalone'] === true ) { var config = require("./config.json"); }


var version 			= 0.2;
var util 				= require('util');



// must export 'store' module.
module.exports.store = function (message, report, callback) {

  // See: http://docs.kurunt.com/store/stream/

  console.log('stream@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
  	// send message to stream report for visulizing.
  	report.message(message);

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
    callback(false);
    return false;
  }

};



