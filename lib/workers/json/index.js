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
module.exports.work = function (message, config, fn, callback) {

  // 'message.message' Format: json
  // Sample: {"hello": "world"}
  //
  // See: http://docs.kurunt.com/worker/json/

  //console.log('MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {

    var json = JSON.parse(message.message.toString(config['encoding']));
    
    var attributes = [];
    attributes['json'] = json;

    return callback( [ message, attributes ] );
  
  } catch(e) {
  	//console.log('ERROR> ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    callback(false);
    return false;
  }

};

