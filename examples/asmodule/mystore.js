//
// Kurunt, My Store
//
// Using Kurunt as a module framework, My Store.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



// must export 'store' module.
module.exports.store = function (message, fn, callback) {
  // use try catch so can skip over invalid messages.
  try {
  
    console.log('mystore.js> EVENT: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
    // Here can do whatever you want to: store, socket.io, fs, db, index, etc, this message.

    // Can extract mymessage from 'mystore' schema.
    var mymessage = undefined;
    for ( var s in message.stores ) {
      for ( var st in message.stores[s] ) {
        if ( st === 'mystore' ) {
          mymessage = message.stores[s][st]['schema']['mymessage']['value'];    // may want to "clone" message.
          //console.log('mystore@stores> mymessage: ' + require('util').inspect(mymessage, true, 99, true));    // here it is, yea!
        }
      }
    }

    return callback( true );    // must return.
  
  } catch(e) {
    //console.log('mystore@stores> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );   // must return.
  }
};


// set the worker config, or call a json config file via require.
var config = {
  "name": "mystore",
  "encoding": "utf8"
};
exports.config = config;    // must export the config so kurunt can read it.

