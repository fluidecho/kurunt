//
// Kurunt, As Module 2
//
// Using Kurunt as a module framework, rather than stand-alone.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var Kurunt         = require("../../");    // call the Kurunt module [require('kurunt')].

var workers       = [];
workers.push(__dirname + '/myworker.js');    // full path to your worker function.
workers.push(__dirname + '/myworker2.js');   // full path to your worker function.

var stores        = [];
stores.push(__dirname + '/mystore.js');      // full path to your store function.


// init: [workers], [stores], (callback function).
Kurunt.init(workers, stores, function(e, kurunt) {

  if (e) {
    console.trace('Error: ' + e);
    process.exit(1);    // exit this program.
  }

  kurunt.events.on('error',  function(e) {
    console.trace('Error: ' + e);
    kurunt.exit();      // exit all running processes as set within topology.json.
    process.exit(1);    // exit this program.
  });


  console.log('asmodule.js> Type Ctrl+c to exit the program.');

  // form new stream.
  var tags = ['test', 'asmodule'];
  var use_stores = ['mystore', 'stream'];   // have set mystore as set above, as well as stream so can view in 'Stream Report'.

  // newStream: input, worker, [stores], [tags], [access_hosts], (callback function).
  kurunt.newStream('tcp', 'myworker', use_stores, tags, [], function(stream) {

    // can now form and send my message into the stream. There are lots of ways you can input data: http://docs.kurunt.com/Input_Data.
    var mymessage = {};
    mymessage.hello = 'world';
    mymessage.num = 101;
    mymessage.fab = true;

    // will send this message in JSON, as that is the format myworker.js is expecting, could use any message format matching worker.
    kurunt.send(stream, JSON.stringify(mymessage), function (sent) {
      console.log('asmodule.js> Sent message: ' + sent + ', mymessage: ' + JSON.stringify(mymessage));
      //kurunt.exit();    // can exit all kurunt processes (as set within topology) when has had time to complete message processing.
      console.log('asmodule.js> Can view processed message at: http://127.0.0.1:9001/.');   // requires socket.io.
    });

  });
  
  // can send another message to another stream, using myworker2.
  kurunt.newStream('http', 'myworker2', use_stores, tags, [], function(stream) {

    // can now form and send my message into the stream. There are lots of ways you can input data: http://docs.kurunt.com/Input_Data.
    //var mymessage = {};
    //mymessage.foo = 'bar';
    //mymessage.int = 9876543210;
   // mymessage.fab = true;
   
    var tuples = 'hello, world, foo, bar';    // message to send, as CSV, A.K.A: "tuples".

    // will send this message in CSV, as that is the format myworker2.js is expecting, could use any message format matching worker.
    kurunt.send(stream, tuples, function (sent) {
      console.log('asmodule.js> Sent message: ' + sent + ', tuples: ' + tuples);
      //kurunt.exit();    // can exit all kurunt processes (as set within topology) when has had time to complete message processing.
      console.log('asmodule.js> Can view processed message at: http://127.0.0.1:9001/.');   // requires socket.io.
    });

  });  

});

