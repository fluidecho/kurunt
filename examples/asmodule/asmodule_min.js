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

Kurunt.init([__dirname + '/myworker.js'], [__dirname + '/mystore.js'], function(kurunt) {
  kurunt.newStream('http', 'myworker', ['mystore', 'stream'], [], [], function(stream) {
 		//console.log('stream> ' + require('util').format(stream));
    console.log('Can input a message using curl, copy/paste into new terminal:\n---------------------------------------------------------------------------------------------------------------\ncurl -X POST -H "Content-Type: application/json" -d \'{"hello":"world"}\' ' + stream.address + '\n---------------------------------------------------------------------------------------------------------------\nCan view processed messages at >>> http://127.0.0.1:9001/ <<< or via API >>> ' + stream.api_address + ' <<< \nCtrl+c to exit.\n...'); 
  });
});
