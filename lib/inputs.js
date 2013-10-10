//
// Inputs
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



// load dependencies.
var util              = require('util');
var fs                = require('fs');



exports._getInputs        = _getInputs;


var inputs            = [];                       // data input apps, like: tcp, http or user created etc.
//exports.inputs          = inputs;                     // inputs (global expose).



function _getInputs(config, cb) { 
	//config.xlog('loading inputs');

	
	// look within directory /lib/inputs/ to discover available inputs.
	
	// load inputs nativly through node require.
	fs.readdir(config.path + '/inputs', function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(input){
			//config.xlog('inputs: ' + input);
			
			var stats = stats = fs.lstatSync(config.path + '/inputs/' + input);
			if (stats.isDirectory()) {      
			
				// if /lib/inputs/_myinput will ignore.
				if ( input.substring(0, 1) != '_' ) {
					// add inputs
					var this_config = require('./inputs/'+input+'/config.json');

					config.xlog('input to load: ' + this_config['name']);
					inputs[this_config['name']] = [];
					//inputs[this_config['name']] = require('./inputs/'+input+'/index.js');
					//inputs[this_config['name']]._load();
					inputs[this_config['name']]['config'] = this_config;
				
				}
			}
		});
		

		// ALSO, TODO: look through ../node_modules/ directory for kurunt.js files within modules,
		// require('kurunt.js') within to see if it's a 'inputs' and load if is.
		// hence users can> npm install myinput	
		
		
		//config.xlog('inputs loaded');
		//console.log('inputsDUMP> ' + util.inspect(inputs, true, 99, true));
		cb(inputs);
		return true;
	});
	
}




