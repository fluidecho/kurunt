//
// Kurunt Redis Store
//
// Redis Store
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


//var log = function(txt, benchmarking, dump) { if ( dump != undefined && config['loging'] === 'debug' ) { console.log(txt + ' >> ' + require('util').inspect(dump, true, 99, true)); } else if ( config['loging'] === 'benchmarking' ) {	if ( benchmarking === true ) { console.log(txt); } } else if ( config['loging'] === 'debug' ) { console.log(txt); } else if ( config['loging'] === 'quiet' ) { } };

var version 		= 0.2;


// make the connection to the redis on load.
var redisclient = undefined;
try {

	var redis = require("redis"),
		redisclient = redis.createClient();

	redisclient.on("error", function (err) {
		//log("redis@store> db error event - " + redisclient.host + ":" + redisclient.port + " - " + err);
	});

	redisclient.on("connect", function () {
		//log("redis@store> db connected.");
	});

} catch(e) {
	//log('redis@store> To use the Redis store you\'ll need to install the redis module: npm install redis -g');
}


// must export 'store' module.
module.exports.store = function (message, report, callback) {

  // See: http://docs.kurunt.com/Redis_Store

  //log('redis@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
  	if ( redisclient === undefined ) {
  		return callback( false );
  	}
  
  	// NOTE: you can write your redis store anyway you prefer!
  	// Instread of just storing the entire js json object using set, take a look at the mysql store example.
  	// You could iterate through each key/value in the message and use hset for example.

		var data = undefined;
		// extract data from 'redis' schema.
		for ( var s in message.stores ) {
			//console.log('s: ' + s + ' value: ' + message.stores[s]);
			for ( var st in message.stores[s] ) {
				//console.log('st: ' + st + ' value: ' + message.stores[s][st]);
				if ( st === 'redis' ) {
					//for ( var v in message.stores[s]['stream']['schema'] ) {
					//	var value = message.stores[s]['stream']['schema'][st]['value'];
					//}
					
	        // NOTE: data, as set by stores.schema will need to be cloned if want complete seperation from original message stores.schema.
          //data  = message.stores[s][st]['schema'];		// faster but effects original message shema.
          data  = JSON.parse(JSON.stringify(message.stores[s][st]['schema']));		// this will slow kurunt, use line 86 otherwise.								

				}
			}
		}

		//log('redis@stores, data> ' + require('util').inspect(data, true, 99, true));    // uncomment to debug.
		if ( data === undefined ) {		
			return callback( false );
		}

		var collectionName = message.apikey.toString() + ':' + message.id.uid;	
		
		redisclient.set(collectionName, JSON.stringify(data));		// using set command, you may pefer using hset etc.

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
    return callback( false );
  }

};


var config = {
	"name": "redis",
	"encoding": "utf8",
	"dbname": "kurunt"
};
exports.config = config;		// must export the config so kurunt can read it.

