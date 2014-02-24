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


// init: topology, [workers], [stores], (callback function). [workers] and [stores] requires full path to your function file.
Kurunt.init(undefined, [__dirname + '/myworker.js'], [__dirname + '/mystore.js'], function(e, kurunt) {

  if (e) {
    console.trace('Error: ' + e);
    process.exit(1);    // exit this program.
  }

  kurunt.events.on('error',  function(e) {
    console.trace('Error: ' + e);
    kurunt.exit();      // exit all running processes as set within topology.json.
    process.exit(1);    // exit this program.
  });
  
  // newStream: input, worker, [stores], [tags], [access_hosts], (callback function).
  kurunt.newStream('http', 'myworker', ['mystore', 'stream'], [], [], function(stream) {

    // Can send my message event into the stream. There are lots of ways you can input data: http://docs.kurunt.com/Input_Data.
    var mymessage = {};
    mymessage.hello = 'world';
    mymessage.num = 101;
    mymessage.fab = true;
    
    // will send this message event in JSON, as that is the format myworker.js is expecting, could use any message format matching worker.
    kurunt.send(stream, JSON.stringify(mymessage), function (sent) {
      //kurunt.exit();    // can exit all kurunt processes (as set within topology) when has had time to complete message processing.
      console.log('Can input a message event using curl, copy/paste into new terminal:\n---------------------------------------------------------------------------------------------------------------\ncurl -X POST -H "Content-Type: application/json" -d \'{"hello":"world"}\' ' + stream.address + '\n---------------------------------------------------------------------------------------------------------------\nCan view processed message events at >>> http://' + stream.host + ':9001/ <<< or via API >>> ' + stream.api_address + ' <<< \nCtrl+c to exit.\n...');   // report requires socket.io. 
    });

  });
  
});

