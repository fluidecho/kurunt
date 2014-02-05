//
// Init(iate)
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var version = "0.2.2";		// !!! SET KURUNT VERSION !!!

module.exports.init = function (kurunt, config, topology, workers, stores, callback) {

  // display if running stand-alone.
  if ( workers === undefined && stores === undefined ) {
    // Copyright Statement - PLEASE DO NOT EDIT OR REMOVE AS REQUIRED BY LICENSE.
    console.log('Welcome to Kurunt (http://kurunt.com).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013-2014 Mark W. B. Ashcroft.\nCopyright (c) 2013-2014 Kurunt.\n');
  }

  // based on topology.json launch inputs, workers, stores - processes.
  var Topo = require('./topology.js');
  Topo.topo(kurunt, config, topology, workers, stores, function(err, xprocesses) {
    //console.log('init.js> xprocesses: ' + require('util').inspect(xprocesses, true, 99, true));
    
		// web admin.
		var webadmin = require('./admin'); 
		webadmin.set_processes(xprocesses);    // send falked 'processes' so admin can newStream, editStream, deleteStream to each process.
		if ( config['admin_www'] === true ) {
			// launch the web admin server.
		  webadmin.init(function() {
		  	return callback( err, xprocesses, webadmin );
		  });	
		} else {
			return callback( err, xprocesses, webadmin );
		}

  });

}

