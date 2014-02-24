//
// Kurunt, Benchmark.
//
// Benchmarking Kurunt's performance.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


// NOTE: Under extreme load may cause breakage, use at own risk.
// Can set ../../config.json:logging = "benchmark".


var Kurunt = require("../../");

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
  
  kurunt.newStream('tcp', 'myworker', ['mystore', 'stream'], [], [], function(stream) {
    //console.log('stream> ' + require('util').format(stream));
    console.log('Can benchmark message processing using perl, copy/paste into new terminal:\n--------------------------------------------\nperl benchmark.pl -T=tcp -P='+stream.apikey+' -m=10 -c=10\n--------------------------------------------\nCan view processed messages at >>> http://127.0.0.1:9001/ <<<\nCtrl+c to exit.\n...');  
  });
  
});
