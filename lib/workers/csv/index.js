//
// Kurunt CSV Worker
//
// Comma Separated Values 'worker' for Kurunt, processing tuple data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: tuple
  // Sample: "hello, world"
  //
  // See: http://docs.kurunt.com/CSV_Worker

  //console.log('MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // NOTE: has no header handling, only values.

  // use try catch so can skip over invalid messages.
  try {
  
    // (1) convert the incoming message.message from buffer to string (text).
    var string = message.message.toString(wk['config']['encoding']);    // "hello world" or whatever sent.
    
    // (2) extract message comma seperated values into a javascript array using 'split' function.
    var message_array = string.split(',');              // convert message to array.
    
    // (3) new array for trimed 'tuple' items.
    var tuples = [];
    for ( var t in message_array ) {
      tuples.push( message_array[t].trim() );                     // cleanup and remove whitespaces, add each item 'tuple' and push into new array.
    }      
    
    // (4) add tuples value to this attribute, which get's added to this messages: stores: schema.
    var attributes = [];
    attributes['tuples'] = tuples;

    // (5) return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('ERROR> ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

