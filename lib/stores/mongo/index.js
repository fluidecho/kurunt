//
// Kurunt Mongo Store
//
// MongoDB Store
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


var version     = 0.2;


// make the connection to the mongo db on load.
var MongoClient = undefined;
var _db = undefined;
try {
  MongoClient = require('mongodb').MongoClient;
  MongoClient.connect('mongodb://127.0.0.1:27017/' + config['dbname'], function(err, db) {
      if(err) throw err;
      _db = db;
      //console.log('mongo@stores> db connected.');
  });
} catch(e) {
  //log('mongo@store> To use the MongoDB store you\'ll need to install the mongodb module: npm install mongodb -g');
}


// must export 'store' module.
module.exports.store = function (message, callback) {

  // See: http://docs.kurunt.com/Mongo_Store

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
        	//console.log('this is the store!');
        	// NOTE: data, as set by stores.schema will need to be cloned if want complete seperation from original message stores.schema.
          //data = message.stores[s][st]['schema'];		// faster but effects original message shema, but does set mongo _id.
          //clone-ish
          data = JSON.parse(JSON.stringify(message.stores[s][st]['schema']));		// this will slow kurunt, use line 62 otherwise.
        }
      }
    }

    if ( data === undefined ) {
      return callback( false );
    }

    // add some extras to data.
    data.id = message.id.uid;     // TODO: would be nice if there's a way to set as number in mongo as too big for js!
    data.ns = message.ns;
    data.band = message.band;
    data.bands = message.bands;
    
    //log('mongo@stores> datacontents' + require('util').inspect(data, true, 99, true));    // uncomment to debug.

    var collectionName = message.worker.object.toString() + '_' + message.apikey.toString();    // set whatever you want.
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
    //console.log('ERROR> ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};


var config = {
	"name": "mongo",
	"encoding": "utf8",
	"dbname": "kurunt"
};
exports.config = config;		// must export the config so kurunt can read it.

