//
// Kurunt Syslog Worker
//
// Syslog 'worker' for Kurunt, processing syslog data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, config, fn, callback) {

  // 'message.message' Format: <pre>timestamp userid tag[pid]: message
  // Sample (rsyslog): <13>Nov 11 14:57:16 marcoxps test[10108]: mary had a little lamb
  // To test syslog: logger -i -t test "mary had a little lamb"
  //
  // See: http://docs.kurunt.com/workers/syslog/
  // See The Syslog Protocol: https://tools.ietf.org/html/rfc5424#page-19
  
  
  console.log('syslog@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
    // convert the incoming message.message from buffer to string.
    var syslog = message.message.toString(config['encoding']);
console.log('syslog@workers> syslog: ' + require('util').inspect(syslog, true, 99, true));

    var attributes = [];
    attributes['message'] = syslog;    //

    // return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    console.log('syslog@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

