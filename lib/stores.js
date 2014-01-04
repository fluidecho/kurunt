//
// Stores
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



// load dependencies.
var util 						= require('util');
var fs 						= require('fs');



var stores						= [];												// data input apps, like: tcp, http or user created etc.
//exports.stores					= stores;											// stores (global expose).



function _getStores(config, cb) { 
	//config.xlog('loading stores');

	
	// look within directory /lib/inputs/ to discover available inputs.
	
	// load inputs nativly through node require.
	fs.readdir(config.path + '/stores/', function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(store){
			//config.xlog('store: ' + store);
			
			var stats = stats = fs.lstatSync(config.path + '/stores/' + store);
			if (stats.isDirectory()) {			
			
				// if /lib/inputs/_myinput will ignore.
				if ( store.substring(0, 1) != '_' ) {
					// add inputs
					var this_config = require('./stores/'+store+'/config.json');

					config.xlog('store to load: ' + this_config['name']);
					stores[this_config['name']] = [];
					//inputs[this_config['name']] = require('./inputs/'+input+'/index.js');
					//inputs[this_config['name']]._load();
					stores[this_config['name']]['config'] = require('./stores/'+store+'/config.json');
				
				}
			}
		});
		

		// ALSO, TODO: look through ../node_modules/ directory for kurunt.js files within modules,
		// require('kurunt.js') within to see if it's a 'stores' and load if is.
		// hence users can> npm install mystore	
		
		
		//config.xlog('stores loaded');
		//console.log('inputsDUMP> ' + util.inspect(stores, true, 99, true));
		cb(stores);
		return true;
	});
	
}



exports._getStores 			= _getStores;

