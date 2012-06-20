#!/usr/bin/env node
//
// Kurunt
//
// Analytics Management Framework for Real-Time Streaming Data.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config 				= require("./config.json");							// this is your config settings.
var g 					= require("./src/functions.js");					// global functions and variables.
var launcher 			= require('./src/launch.js');						// for launching daemons like node.js programs or sphinx (searchd).
var nimble 				= require('./src/nimble.min.js');	

var etl 				= '';

// load global functions and variables before starting kurunt apps.
g.startup(
  function (cb) {
	// start kurunt.
	g.log('*Starting Kurunt');
	
	// start sphinx before etl, inputs and mysql proxy can start anytime, www last.
	nimble.series([
		function (callback) {
			launcher.run('searchd --stopwait', function (cb) {
				callback();	
			});
		},
		function (callback) {
			launcher.run('searchd --config ' + config['path'] + '/src./sphinx_config.js', function (cb) { 
				callback();	
			});
		},
		function (callback) {
			g.lastSphinxID(g.indexes, function (cb) {
				g.logDebug('indexes loaded');
				callback();
			});
		},		
		function (callback) {
			// start ETL server (now that sphinx has started).
			etl = require("./src/etl.js");
			etl._load();		// db_mysql loads sync so don't need to have callback on _load().
			callback();
		},
		function (callback) {
			// start www last to prevent user generated error, like form submit before stuff connected/loaded etc.
			// only starts www if www_standalone = false, else asumes not needed or running seperatly standalone.
			if ( config['www_standalone'] === false ) {
				// start www.
				var www = require("./www/www.js");
				www.startwww(etl, function (cb) {
					callback();
				});
			} else {
				callback();
			}
		},				
		function (callback) {
			g.log('Kurunt is READY.\n>>>');
			callback();
		}
	]);	
	
});
