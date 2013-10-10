#!/usr/bin/env node
//
// Kurunt (main)
//
// Scalable Message Processing Framework.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var kurunt 		= require("kurunt");

var config 		= require("./config.json");
var topology 	= require("./topology.json");
var data 		= require("./data.json");



// must first launch kurunt.
kurunt.init(data, topology, config, function (err, res) {
	if err throw new Error(err.message);
	
	// get the list of inputs.
	kurunt.getInputs(function (err, inputs) {
		// inputs: array
	});

	// get the list of schemas.
	kurunt.getSchemas(function (err, schemas) {
		// schemas: array
	});

	// get the list of stores.
	kurunt.getStores(function (err, stores) {
		// stores: array
	});

	// get the list of datas.
	kurunt.getData(function (err, datas) {
		// datas: array
	});

	// create new data.
	kurunt.newData(function (err, data) {
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
	kurunt.sendMessage(data.address, message, function (err, res) {
		if err throw new Error(err.message);
		// res: object
	});
	
	// message events.
	kurunt.messages.on('message',  function(message) {
		// message: object, processed message
	});	
	
});





