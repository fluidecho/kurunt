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
    //console.log('myworker@workers> mymessage: ' + require('util').inspect(mymessage, true, 99, true));    // uncomment to debug message.
    
    // Can set the attributes, as they match with: config.stores.mystore.schema.
    var attributes = [];
    attributes['mymessage'] = mymessage;

    return callback( [ message, attributes ] );   // must return.
  
  } catch(e) {
    //console.log('myworker@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
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

