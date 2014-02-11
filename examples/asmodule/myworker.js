//
// Kurunt, My Worker
//
// Using Kurunt as a module framework, My Worker.
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

    console.log('myworker.js> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
    // Can process the message anyway you want, use: functions, parse, regex, filter, augment, geoip, etc.
    
    var mymessage = JSON.parse( message.message.toString(wk['config']['encoding']) );   // example for JSON formatted data.
    fn.logging.log('myworker@workers> mymessage: ', mymessage);
    
    // Can set the attributes, as they match with: config.stores.mystore.schema.
    var attributes = [];
    attributes['mymessage'] = mymessage;

    return callback( [ message, attributes ] );   // must return.
  
  } catch(e) {
    fn.logging.log('myworker@workers> ERROR: ', e);
    return callback( false );   // must return.
  }
};


// set the worker config, or call a json config file via require.
var config = {
  "name": "myworker",
  "title": "My Worker",
  "description": "Using Kurunt as a module framework, My Worker.",
  "inputs": [ "tcp", "udp", "http" ],
  "encoding": "utf8",
  "stores": [
    {
      "mystore": {
        "schema": {
          "mymessage": { }
        }
      }
    }
  ]
};
exports.config = config;    // must export the config so kurunt can read it.

