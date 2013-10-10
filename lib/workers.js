//
// Workers
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



// load dependencies.
var util 							= require('util');
var fs 								= require('fs');



var workers						= [];												// data input apps, like: tcp, http or user created etc.



function _getWorkers(config, cb) { 
	//config.xlog('loading workers');

	
	// look within directory /lib/workers/ to discover available workers.
	
	// load inputs nativly through node require.
	fs.readdir(config.path + '/workers/', function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(worker){
			//config.xlog('worker: ' + worker);
			
			var stats = stats = fs.lstatSync(config.path + '/workers/' + worker);
			if (stats.isDirectory()) {
       			//console.log('worker is dir');
			
				// if /lib/workers/_myworker will ignore.
				if ( worker.substring(0, 1) != '_' ) {
					// add worker
					var this_config = require('./workers/'+worker+'/config.json');

					config.xlog('worker to load: ' + this_config['name']);
					workers[this_config['name']] = [];
					//inputs[this_config['name']] = require('./workers/'+worker+'/index.js');
					//inputs[this_config['name']]._load();
					workers[this_config['name']]['config'] = require('./workers/'+worker+'/config.json');
				
				}
			
			}
			
		});
		
		// ALSO, TODO: look through ../node_modules/ directory for kurunt.js files within modules,
		// require('kurunt.js') or perhapse 'config.json' within to see if it's a 'worker' and load if is.
		// hence users can> npm install myworker
		
		
		//config.xlog('workers loaded');
		//console.log('inputsDUMP> ' + util.inspect(workers, true, 99, true));
		cb(workers);
		return true;
	});
	
}



exports._getWorkers 			= _getWorkers;

