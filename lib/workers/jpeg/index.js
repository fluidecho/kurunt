//
// Kurunt JPEG Worker
//
// JPEG binary image 'worker' for Kurunt, processing jpeg data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: string
  // Sample: "hello world"
  //
  // See: http://docs.kurunt.com/JPEG_Worker

  //console.log('jpeg@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {

    var attributes = [];
    attributes['jpeg_image'] = message.message;

    // return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('string@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

