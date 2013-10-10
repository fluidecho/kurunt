//
// Kurunt Worker Module
//
// Kurunt Worker Module.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config 						= require("./config.json");							// config settings for this worker.
var util 							= require('util');


exports.process				= process;

var version 					= 0.2;


function process(message, attributes, functions, callback) {


//	if ( callback != undefined ) {
//    callback(true);
//  } 


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
		attr_values['hello'] = tuples;																					// add 'tuples' array values to this attribute value, which get's added to the stores schema.


	} catch(e) {
	
		callback(false);
		return false;
		
	}



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



