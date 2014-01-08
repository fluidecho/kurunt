//
// Kurunt, As Module (minimal example).
//
// Using Kurunt as a module framework, rather than stand-alone.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var Kurunt = require("../../");
Kurunt.init(undefined, undefined, {myworker:__dirname + '/myworker.js'}, {mystore:__dirname + '/mystore.js'}, function(kurunt) {
  kurunt.newStream('tcp', 'myworker', ['mystore', 'stream'], [], [], function(stream) {
    kurunt.send(stream, JSON.stringify({foo:'bar'}), function (e, sent) {
      console.log('Can view processed message at: http://127.0.0.1:9001/, Ctrl+c to exit.');   // requires socket.io.
    });
  });
});
