#!/usr/bin/env node
//
// Kurunt CLI (bin executable app)
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var Kurunt = require("../");    // call the Kurunt module [require('kurunt')].
var config = require('.././config.json');


// init: [workers], [stores], (callback function).
Kurunt.init(undefined, undefined, function(e, kurunt) {
  if ( e ) {
    console.trace('Error: ' + e);
    process.exit(1);    // exit this program.
  }
  kurunt.events.on('error',  function(e) {
    console.trace('Error: ' + e);
    if ( config["exit_on_error"] ) {
      kurunt.exit();    // exit all running processes as set within topology.json.
      process.exit(1);  // exit this program.
    } 
  });
});

