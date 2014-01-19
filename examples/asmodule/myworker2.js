//
// Kurunt, My Worker 2
//
// Using Kurunt as a module framework, My Worker 2.
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

    console.log('myworker2.js> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
    // Can process the message anyway you want, use: functions, parse, regex, filter, augment, geoip, etc.

    // (1) convert the incoming message.message from buffer to string (text).
    var string = message.message.toString(wk['config']['encoding']);    // "hello world" or whatever sent.
    
    // (2) extract message comma seperated values into a javascript array using 'split' function.
    var message_array = string.split(',');              // convert message to array.
    
    // (3) new array for trimed 'tuple' items.
    var tuples = [];
    for ( var t in message_array ) {
      tuples.push( message_array[t].trim() );                     // cleanup and remove whitespaces, add each item 'tuple' and push into new array.
    }          
    
    // Can set the attributes, as they match with: config.stores.mystore.schema.
    var attributes = [];
    attributes['tuples'] = tuples;

    return callback( [ message, attributes ] );   // must return.
  
  } catch(e) {
    //console.log('myworker2@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );   // must return.
  }
};


// set the worker config, or call a json config file via require.
var config = {
  "name": "myworker2",
  "title": "My Worker 2", 
  "description": "Using Kurunt as a module framework, My Worker 2.",
  "inputs": [ "tcp", "udp", "http" ],
  "mq_nodelay": false,
  "message_codec": "json",
  "encoding": "utf8",
  "stores": [
    {
      "mystore": {
        "schema": {
          "tuples": { }
        }
      }
    } 
  ]
};
exports.config = config;    // must export the config so kurunt can read it.

