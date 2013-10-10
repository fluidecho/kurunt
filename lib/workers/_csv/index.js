//
// Kurunt Test Worker
//
// Testing for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config 						= require("./config.json");							// config settings for this worker.
var fs								= require('fs');
var util 							= require('util');


exports._load 				= _load;
exports.schema 				= schema;



var version 					= 0.2;

//var cp			 				= require('child_process');

process.on('SIGINT', function() {
	console.log('test@workers> SIGINT, stoping.');
  process.exit(0);
});





var timer = function(){
	var start,
			end;
	

	return {
		start: function(){
			start = new Date().getTime();
		},
		stop: function(){
			end = new Date().getTime();
		},
		getTime: function(){
			return time = (end - start) / 1000;
		}
	};
}


var t = timer();
var timetaken 				= 0;
var benchmarking_starttime		= 0;



var loaded 						= false;

var i = 0;
var mps = 0;

var n = 0;





// expose functions.
exports._load = _load;
exports.schema = schema;



var nodeID 		= '#-1:';
process.argv.forEach(function(val, index, array) {
	if ( val.substring(0,5) === 'fork#' ) {
		nodeID 		= val.substring(4) + ':';
	}
});



// does this app run standalone or as a module?
var running_standalone = false;	// false = required as a module.
process.argv.forEach(function(val, index, array) {
	if ( val === 'forked' ) {
		console.log("I'm forked not standalone.");
		// load topology.json from admin.
		running_standalone = false;
		//var topology 					= require("./topology.json");	
		//_load('');
	}
});


var running_standalone = false;	// false = required as a module.
if ( require.main === module ) {
	console.log("called directly");
	running_standalone = true;
} else {
	console.log("required as a module");
}

// does this app run standalone or as a module?
if ( running_standalone === true ) { 
	this._load(); 

}



var batched_msg = "";
//var config_batching_size = 524288;		// .5 MBs






// this function gets called when first process.on('message' is triggered, (must always have _load function).
function _load(topology, workerid) {
	
	if ( workerid != undefined ) {
		nodeID 		= '#'+workerid+':';
	}
	
	if ( running_standalone === true ) {
		// copyright statement.
		console.log('Welcome to Kurunt ' + config['title'] + ' Worker (http://kurunt.org).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013 Mark W. B. Ashcroft.\nCopyright (c) 2013 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		//g.log('*Loading ' + config['title'] + ' Schema.', config);
		console.log('*Loading ' + config['title'] + ' Worker.');
	}


	// Message format: tuple
	// SAMPLE: 'hello,world'
	//
	// See Kurunt: 		http://docs.kurunt.com/worker/test/
	

	console.log(nodeID + 'test@workers> loaded');
	loaded = true; 


	setInterval(function () {		

		console.log(nodeID + 'test@workers> mps: ' + mps + ' n: ' + n);
		//console.log('BLAH!!!');	
		//process.send('benchmark> blah');
		mps = 0;		// reset
	}, 1000);


}







function schema(k, message, callback) {

	// test functions passed to worker
	//k.talk('test here');
	//k.pause();
	console.log('DUMPa> ' + util.inspect(message, true, 99, true));


	if ( !config['encoding'] ) {
		config['encoding'] = 'utf8';
	}
	
	message.encoding 				= config['encoding'];
	message.reports 				= config['reports'];
	
	var attr_values 			= [];


	try {
	
		
		message.message = message.message.toString(config['encoding']);				// first convert message from buffer to string (as i know this message is a string and not binary data).
		
		var message_arr = message.message.split(',');													// now can convert message to array from tuple and trim.
		
		var tuples = [];																											// new array for trimed 'tuple' items.
		
		for ( var t in message_arr ) {
			tuples.push( message_arr[t].trim() );																// trim each item 'tuple' and push into new array.
		}  
		
	} catch(e) {
	
		callback(false);
		return false;
		
	}

	attr_values['tuples'] = tuples;																					// add 'tuples' array values to this attribute value, which get's added to the stores schema.


	var attributes = [];
	attributes['store'] = [];
	arrtibutes['store']['tuples'] = tuples;

	
	if ( message.stores[0] == '*' ) {
		message.stores = [];
		console.log('yes store for this message: *');
		for ( var s in config['stores'] ) {
			for ( var i in config['stores'][s] ) {
				message.stores.push(i);
			}
		}	
	}	
	
	// for each stores schema attribute in config.json.
	for ( var s in config['stores'] ) {
		//console.log('stores s> ' + s + util.inspect(config['stores'][s], true, 99, true));
		for ( var i in config['stores'][s] ) {
			//console.log('i: ' + i + ' : ' + config['stores'][s][i]['schema']);
			
			
			for ( var x = 0; x < message.stores.length; x++ ) {
			//for ( var x in message.stores ) {
			console.log('store x: ' + x + ' : ' + message.stores[x]);	
				if ( i === message.stores[x] ) {
					console.log('yes store for this message: ' + i);
					message.stores[x] = config['stores'][s];
					for ( var a in config['stores'][s][i]['schema'] ) {
						console.log('a: ' + a + ' : name ' + config['stores'][s][i]['schema'][a]['name'] + ' type ' + config['stores'][s][i]['schema'][a]['type'] );
					
						console.log('value: ' + attr_values[config['stores'][s][i]['schema'][a]['name']]);
						message.stores[x][i]['schema'][a].value 		= attr_values[config['stores'][s][i]['schema'][a]['name']];
						message.stores[x][i]['schema'][a].id 		= -1;
					}					
					
					
				}
			
			
			}


		}
	}		
	
	delete message.message;		// can now delete orgional message, as probably dont need to use it again.

	console.log('DUMPb> ' + util.inspect(message, true, 99, true));
	//console.log('mjson>' + JSON.stringify(message) + '<');
	mps++;
	n++;
	
	//k.resume();
	callback(message, n);
	return true;

}



