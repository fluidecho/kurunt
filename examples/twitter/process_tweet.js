//
// Kurunt, process_tweet.
//
// Processing Twitter tweets.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {
  // use try catch so can skip over invalid messages.
  try {

    //console.log('process_tweet@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
    var tweet = JSON.parse( message.message.toString(wk['config']['encoding']) );   // tweets are JSON formatted data.
    //console.log('process_tweet@workers> tweet: ' + require('util').inspect(mymessage, true, 99, true));    // uncomment to debug message.
    
    var attributes = [];
    attributes['tweet'] = tweet;

    return callback( [ message, attributes ] );   // must return.
  
  } catch(e) {
    //console.log('process_tweet@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );   // must return.
  }
};


// set the worker config, or call a json config file via require.
var config = {
  "name": "process_tweet",
  "title": "process_tweet",
  "description": "Kurunt, process_tweet.",
  "inputs": [ "tcp" ],
  "encoding": "utf8",
  "stores": [
    {
      "store_tweet": {
        "schema": {
          "tweet": { }
        }
      }
    }   
  ]
};
exports.config = config;    // must export the config so kurunt can read it.

