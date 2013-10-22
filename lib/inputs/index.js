//
// Kurunt Inputs
//
// Loads and routes messages from inputs (TCP, UDP, HTTP) to workers for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util 							= require('util');
var messenger 				= require('./messenger');

var config 						= undefined;
var topology 					= undefined;

var fs 								= require('fs');


var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	console.log(processID + '@workers> SIGINT, exit.');
  process.exit(code=0);
});


var inputs = {};


var mps = 0;
var tot = 0;


var processID = '*#' + process.pid;
// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log('*workers, process.on.message>' + util.inspect(m, true, 99, true));
	var pid = 0;
	if ( m.id !== undefined ) {
		processID = '*#' + m.id;
		pid = m.id;
	}
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	_init(pid, config, topology);
});



function _init(pid, config, topology) {

	console.log(processID + "@inputs> initiating.");
	
	// initiate messenger
	messenger.init(pid, topology);

	_loadAllInputs(pid, topology);

	loaded = true; 
	
}



function _loadAllInputs(pid, topology) {

	// load each input with require
	// look within directory /lib/inputs/ to discover available inputs.
	
	// load inputs nativly through node require.
	fs.readdir(__dirname, function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(input){
			//console.log('input: ' + input);
			
			var stats = stats = fs.lstatSync(__dirname + '/' + input);
			if (stats.isDirectory()) {
				// if /lib/inputs/_myinput will ignore the underscored directories.
				// NOTE: if you only want particular workers to load, underscore unwanted directories.
				if ( input.substring(0, 1) != '_' ) {
					// add worker
					var this_config = require('./' + input + '/config.json');
					console.log('input to load: ' + this_config['title']);
					
					inputs[input] = [];
					
					inputs[input]['config'] = this_config;
					
					if ( !inputs[input]['config']['encoding'] ) {
						inputs[input]['config']['encoding'] = 'utf8';
					}
					
					inputs[input]['module'] = require('./' + input + '/index.js');
					//inputs[input]._load('', inputid);
					inputs[input]['module']._init(pid, messenger);

				}
			
			}
		
		});	
	});

}


