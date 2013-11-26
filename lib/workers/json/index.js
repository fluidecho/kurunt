//
// Kurunt JSON Worker
//
// JSON 'worker' for Kurunt, processing json formated data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: json
  // Sample: {"hello": "world"}
  //
  // See: http://docs.kurunt.com/workers/json/

  //console.log('json@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {

    var json = JSON.parse(message.message.toString(wk['config']['encoding']));

		//console.log('json@workers> json: ' + require('util').inspect(json, true, 99, true));
    
    var attributes = [];
    attributes['json'] = json;

    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('json@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

