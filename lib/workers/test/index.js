//
// Kurunt Test Worker
//
// Simple test 'worker' for Kurunt, processing string data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, config, fn, callback) {

  // 'message.message' Format: string
  // Sample: "hello world"
  //
  // See: http://docs.kurunt.com/worker/test/

  console.log('MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
    // (1) convert the incoming message.message from buffer to string (text).
    var string = message.message.toString(config['encoding']);    // "hello world" or whatever sent.
    
    // (2) add string value to this attribute, which get's added to this messages: stores: schema.
    var attributes = [];
    attributes['text'] = string;    // "hello world" or whatever sent.

    // (3) return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
  console.log('error> ' + require('util').inspect(e, true, 99, true));
    callback(false);
    return false;
  }

};

