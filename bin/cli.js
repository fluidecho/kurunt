#!/usr/bin/env node
//
// Kurunt CLI (bin executable app)
//
// Scalable Message Processing Framework.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var Kurunt    		= require("../");																	// call the Kurunt module [require('kurunt')].
var config    		= require(".././config.json");
var streams    		= require(".././streams.json");
var topology  		= require(".././topology.json");
var kurunt    		= new Kurunt.init(config, streams, topology);				// initiate the Kurunt aplication.

var util      		= require('util');



//
// Kurunt module API's.
//



// get the list of inputs.
kurunt.getInputs(function (err, inputs) {
	if ( err ) {
		throw new Error(err.message);
	} 
	// inputs: array
	//console.log('inputs> ' + util.inspect(inputs, true, 99, true));
});



// get the list of workers.
kurunt.getWorkers(function (err, workers) {
	if ( err ) {
		throw new Error(err.message);
	} 
	// workers: array
	//console.log('workers> ' + util.inspect(workers, true, 99, true));
});
	
	
// get the list of stores.
kurunt.getStores(function (err, stores) {
	if ( err ) {
		throw new Error(err.message);
	} 
	// stores: array
	//console.log('stores> ' + util.inspect(stores, true, 99, true));
});


// get the list of streams.
kurunt.getStreams(function (err, streams) {
	if ( err ) {
		throw new Error(err.message);
	} 

	// streams: array
	//console.log('streams> ' + util.inspect(streams, true, 99, true));
}); 
	



/*
kurunt.send('hello,world', function (msg) {
	console.log("%j", msg); // processed message.
});
*/















/*
// must first launch kurunt.
kurunt.init(data, topology, config, function (err, res) {
	if ( err ) {
		throw new Error(err.message);
	}
	
	console.log('kurunt.init');
	
	// get the list of inputs.
	kurunt.getInputs(function (err, inputs) {
		if ( err ) {
			throw new Error(err.message);
		} 
		// inputs: array
		console.log('> ' + util.inspect(inputs, true, 99, true));
	});

	// get the list of schemas.
	kurunt.getSchemas(function (err, schemas) {
		if ( err ) {
			throw new Error(err.message);
		} 
		// inputs: array
		console.log('> ' + util.inspect(schemas, true, 99, true));
	});

	// get the list of stores.
	kurunt.getStores(function (err, stores) {
		if ( err ) {
			throw new Error(err.message);
		} 
		// inputs: array
		console.log('> ' + util.inspect(stores, true, 99, true));
	});

	// get the list of datas.
	kurunt.getData(function (err, datas) {
		if ( err ) {
			throw new Error(err.message);
		} 
		// datas: array
		console.log('> ' + util.inspect(datas, true, 99, true));
	});

	// create new data.
	kurunt.newData(nodes[], inputs[], worker, stores[], tags[], access_hosts[], function (err, data) {
		// data: object
	});

	// open this data.
	kurunt.openData(data.apikey, function (err, data) {
		// data: object
	});

	// close this data.
	kurunt.closeData(data.apikey, function (err, data) {
		// data: object
	});

	// delete this data.
	kurunt.deleteData(data.apikey, function (err, inputs) {
		// data: object
	});

	// send message for processing to open data (kurunt.openData).
	//kurunt.sendMessage(data.address, message, function (err, res) {
		
		// res: object
	//});

	// message event listener.
	kurunt.getMessages().on('message',  function(message) {
		// message: object, processed message
		console.log('message: ' + message);
	});
});




*/



