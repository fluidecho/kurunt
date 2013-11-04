//
// Kurunt Mongo Store
//
// MongoDB Store
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config = require("./config.json");		// local config.

var log 				= function(txt) { if ( config['debug'] === 'benchmarking' || config['debug'] === 'debug' ) { console.log(txt); } };

var version 		= 0.2;


// make the connection to the mongo db on load.
var MongoClient = undefined;
var _db = undefined;
try {
	MongoClient = require('mongodb').MongoClient;
	MongoClient.connect('mongodb://127.0.0.1:27017/' + config['dbname'], function(err, db) {
			if(err) throw err;
			_db = db;
	});
} catch(e) {
	log('mongo@store> To use the MongoDB store you\'ll need to install the mongodb module: npm install mongodb');
}


// must export 'store' module.
module.exports.store = function (message, report, callback) {

  // See: http://docs.kurunt.com/stores/mongo/

  log('mongo@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
  	if ( MongoClient === undefined ) {
  		return callback( false );
  	}
  
  	// NOTE: you can write your mongoDB store anyway you prefer!

		var data = undefined;
		// extract data from 'mongo' schema.
		for ( var s in message.stores ) {
			//console.log('s: ' + s + ' value: ' + message.stores[s]);
			for ( var st in message.stores[s] ) {
				//console.log('st: ' + st + ' value: ' + message.stores[s][st]);
				if ( st === 'mongo' ) {
					//for ( var v in message.stores[s]['stream']['schema'] ) {
					//	var value = message.stores[s]['stream']['schema'][st]['value'];
					//}
					data = message.stores[s][st]['schema'];
				}
			}
		}

		log('mongo@stores, data> ' + require('util').inspect(data, true, 99, true));    // uncomment to debug.
		if ( data === undefined ) {		
			return callback( false );
		}

		var collectionName = message.apikey;		// set whatever you want.
		if ( typeof collectionName === 'number' ) {
			collectionName = 'a' + collectionName.toString();		// convert apikey if port number to string with leading 'a' so can use > db.a5555.find() for example in mongo shell.
		}

		var collection = _db.collection(collectionName);
		collection.insert(data, function(err, docs) {
			/*
			collection.count(function(err, count) {
				console.log(format("count = %s", count));
			});
				
			// Locate all the entries using find
			collection.find().toArray(function(err, results) {
				//console.dir(results);
				// Let's close the db
				db.close();
			});
		   */
		});

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
  console.log('ERROR> ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

