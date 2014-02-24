//
// Kurunt (main) API exposure.
// Can call this module from own node.js:
// var Kurunt = require("./index"); var kurunt = new Kurunt();
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var events    = require('events');
var logging   = require('./logging');

var config    = require('.././config.json');;
var topology  = undefined;
var returned  = false;
var kurunt    = {};   // holding the kurunt api functions.

// API files.
var newstream = require('./newstream');
var Send      = require('./send');



// handle uncaught exceptions. If kurunt exits, best practice would be then to restart with say forever/upstart.
process.on('uncaughtException', function (err) {
  logging.log('kurunt.js> uncaughtException returned: ' + returned + ' error: ' + err); 
  if ( returned === true ) {
    kurunt.events.emit('error', err.stack);
  } else {
    console.trace('Error: ' + err.stack);
    if ( config["exit_on_error"] ) {
      if ( typeof( kurunt.exit ) === 'function' ) {
        kurunt.exit();    // exit all running processes as set within topology.json.
      }
      process.exit(1);    // exit this program.
    }
  }
}); 



// expose kurunt:
exports.init = function(xtopology, xworkers, xstores, callback){
  return new Kurunt(xtopology, xworkers, xstores, callback)
}


// Kurunt.
function Kurunt(xtopology, xworkers, xstores, callback) {

  if ( config.path === undefined || config.path === '' ) {
    config.path = __dirname;
  }
  
  if ( xtopology === undefined || xtopology === '' ) {
    topology = require('.././topology.json');
  } else {
    topology = xtopology;
  }
  
  var workers = xworkers;
  var stores = xstores;
    
  kurunt.events = new events.EventEmitter();

  // initiate kurunt application -----------------------------
  var initiate = require('./init');
  initiate.init(kurunt, config, topology, workers, stores, function(err, processes, webadmin) {

    kurunt.processes = processes;   // callback: 'processes', can be used to send commands to each falked process, such as newStream, deleteStream etc.

    // exit function for all running node processes as set for this_node in topology.
    kurunt.exit = function () {
      for ( var p in processes ) {
        processes[p].kill();
      }
      process.exit(0);
    };

    if ( err ) {
      logging.log('kurunt.js> initiate.init:processes = false (error on launch)');
      returned = true;
      return callback( err, kurunt );
    }

    // set functions for kurunt as module.
    kurunt.newStream = function (input, worker, stores, tags, access_hosts, newStreamCB) {
      //console.log('kurunt.js> newStream: ' + require('util').inspect(workerFunction, true, 99, true));
      logging.log('kurunt.js> newStream');
      newstream._new(webadmin, config, processes, input, worker, stores, tags, access_hosts, function(stream) {
        return newStreamCB( stream );
      });
    };

    kurunt.send = function (stream, message, cb) {
      Send._send(stream, message, function(sent) {
        return cb( sent);   // returns: error, sendFunc.
      });
    };

    // display if running stand-alone.
    if ( workers === undefined && stores === undefined ) {
      console.log('Type Ctrl+c to exit the program.\n>>>');
    }

    returned = true;
    return callback( null, kurunt );    // Now launched, return.

  });

}

