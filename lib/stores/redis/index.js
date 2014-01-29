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


var config = {
	"name": "redis",
	"encoding": "utf8"
};
exports.config = config;		// must export the config so kurunt can read it.


var redisclient = undefined;


module.exports.init = function (processID, cf, fn) {

	// make the connection to the redis on load.
	try {

		var redis = require("redis");
		redisclient = redis.createClient();

		redisclient.on("error", function (err) {
			fn.logging.log("redis@store> db error event - " + redisclient.host + ":" + redisclient.port + " - " + err);
		});

		redisclient.on("connect", function () {
			fn.logging.log("redis@store> db connected.");
		});

	} catch(e) {
		fn.logging.log('redis@store> To use the Redis store you\'ll need to install the redis module: npm install redis -g');
	}

};



// must export 'store' module.
module.exports.store = function (message, fn, callback) {

  // See: http://docs.kurunt.com/Redis_Store

  fn.logging.log('redis@stores, MESSAGE>', message);

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
	        // NOTE: data, as set by stores.schema will need to be cloned if want complete seperation from original message stores.schema.
          //data  = message.stores[s][st]['schema'];		// faster but effects original message schema.
          data  = JSON.parse(JSON.stringify(message.stores[s][st]['schema']));		// this will slow kurunt, use line previous otherwise.								
				}
			}
		}

		fn.logging.log('redis@stores, data>', data);
		if ( data === undefined ) {		
			return callback( false );
		}

		var key = message.apikey.toString() + ':' + message.id.uid;	
		
		redisclient.set(key, JSON.stringify(data));		// using set command, you may pefer using hset etc.

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
  	fn.logging.log('redis@stores, ERROR> ', e);
    return callback( false );
  }

};

