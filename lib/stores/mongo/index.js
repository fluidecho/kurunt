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
			console.log('mongo@stores> db connected.');
	});
} catch(e) {
	log('mongo@store> To use the MongoDB store you\'ll need to install the mongodb module: npm install mongodb');
}


// must export 'store' module.
module.exports.store = function (message, report, callback) {

  // See: http://docs.kurunt.com/stores/mongo/

  //log('mongo@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

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
				if ( st === config['name'] ) {
					//for ( var v in message.stores[s]['stream']['schema'] ) {
					//	var value = message.stores[s]['stream']['schema'][st]['value'];
					//}
					data = message.stores[s][st]['schema'];
				}
			}
		}

		if ( data === undefined ) {		
			return callback( false );
		}

		// add some extras to data.
		data.id = message.id;			// TODO: would be nice if there's a way to set as number in mongo as too big for js!
		data.ns = message.ns;
		data.band = message.band;
		data.bands = message.bands;
		
		//log('mongo@stores> datacontents' + require('util').inspect(data, true, 99, true));    // uncomment to debug.

		var collectionName = message.worker.object.toString() + '_' + message.apikey.toString();		// set whatever you want.
		//console.log('mongo@stores> collectionName: ' + collectionName);
		
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

