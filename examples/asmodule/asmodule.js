//
// Kurunt, As Module
//
// Using Kurunt as a module framework, rather than stand-alone.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var Kurunt = require("../../");    // call the Kurunt module [require('kurunt')].


// init: [workers], [stores], (callback function). [workers] and [stores] requires full path to your function file.
Kurunt.init([__dirname + '/myworker.js'], [__dirname + '/mystore.js'], function(kurunt) {

  // newStream: input, worker, [stores], [tags], [access_hosts], (callback function).
  kurunt.newStream('http', 'myworker', ['mystore', 'stream'], [], [], function(stream) {

    // Can send my message into the stream. There are lots of ways you can input data: http://docs.kurunt.com/Input_Data.
    var mymessage = {};
    mymessage.hello = 'world';
    mymessage.num = 101;
    mymessage.fab = true;

    // will send this message in JSON, as that is the format myworker.js is expecting, could use any message format matching worker.
    kurunt.send(stream, JSON.stringify(mymessage), function (e, sent) {
      //kurunt.exit();    // can exit all kurunt processes (as set within topology) when has had time to complete message processing.
      console.log('asmodule.js> Can view processed message at >>> http://127.0.0.1:9001/ <<<\nType Ctrl+c to exit the program.\n...');   // report requires socket.io.
    });

  });
  
});

