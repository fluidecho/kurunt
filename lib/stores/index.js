//
// Kurunt Stores
//
// Loads and routes messages from workers to stores for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util 							= require('util');
var messenger 				= require('./messenger');

var config 						= undefined;
var topology 					= undefined;

var fs 								= require('fs');
var cluster 					= require('cluster');
var cp 								= require('child_process');

//exports._load 				= _load;
var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	console.log(processID + '@stores> SIGINT, exit.');
  process.exit(code=0);
});



var stores = {};
var stores_asmodules = {};
var reports = {};



var mps = 0;
var tot = 0;


var processID = '*#' + process.pid;
var id = 0;

// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log('*stores, process.on.message>' + util.inspect(m, true, 99, true));
	if ( m.id !== undefined ) {
		processID = '*#' + m.id;
		id = m.id;
	}
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	_init(config, topology);
});




// does this app run standalone.
process.argv.forEach(function(val, index, array) {
	console.log('stores> agr: ' + val);
	
	if ( val.substring(0, 8) === '-stores=' ) {
		stores_asmodules = JSON.parse(val.substring(8));
		console.log('stores> load these workers: ' + stores_asmodules);
		console.log('stores> workers: ' + require('util').inspect(stores_asmodules, true, 99, true));
	}
	
});



function _init(config, topology) {

	console.log(processID + "@stores> initiating.");

	_loadAllStores();
	_loadAllReports();

	var all_zmq_connect = true;
	var messages = [];
	var connections = [];
	
	if ( topology != undefined ) {
		var c = 0;
		for ( c = 0; c < topology['connections'].length; c++ ) {
			//console.log('connections> ' + util.inspect(topology['connections'][c], true, 99, true));
			//console.log('ZMQ this connection!!!');
			connections.push(topology['connections'][c]);
			if ( topology['connections'][c]['zmq_socket'] != 'connect' ) {
				all_zmq_connect = false;
			}
		}
	}
	
	// fn (worker functions) prototype for woker to call.
	var Fn = function() { };
	Fn.prototype.hello = function() { return console.log('world'); };
	Fn.prototype.pause = function() { return messenger.pause() };
	Fn.prototype.resume = function() { return messenger.resume() };
	var fn = new Fn();
		 
	setInterval(function () {		
		console.log(processID + '@stores> mps: ' + mps + ' total: ' + tot);
		mps = 0;		// reset
	}, 1000);	
	
	var u = 0;
	var rep = {};
	
	

	
	var messages = messenger.init(config, connections);
	messages.on('message',  function(x, message, reply) {
		//console.log('storemessageDUMP> ' + util.inspect(message, true, 99, true));
		//console.log('message> ' + util.inspect(message, true, 99, true));
				
		//_messages.emit('message', message);


		// route message by store
		for ( var s in message.stores ) {
		
			//console.log('*@stores> store: s' + s + ' - ' + message.stores[s] );
		
			// if store schema-d by worker. 
			if ( typeof message.stores[s] === 'object' ) {

				for ( var st in message.stores[s] ) {
					//console.log('*@stores> store: ' + st + ' - ' + message.stores[s][st] );
					//console.log('*@stores> store d> ' + util.inspect(message.stores[s], true, 99, true));

					var r = undefined;		// reports module.
					if ( typeof reports[st] === 'object' ) {
						r = reports[st]['module'];
					}

					stores[st]['module'].store(message, r, function(res) {
				
					});
				}			
			
			} else {
			// if store un-schema-d by worker. 
				var st = message.stores[s].toString();
			
				//console.log('*@stores> store: ' + st );
				//console.log('*@stores> store d> ' + util.inspect(message.stores[s], true, 99, true));

				var r = undefined;		// reports module.
				if ( typeof reports[st] === 'object' ) {
					r = reports[st]['module'];
				}

				stores[st]['module'].store(message, r, function(res) {
				
				});
			
			}

		}

		mps++;
		tot++;
			
	});	
	loaded = true; 
}



function _loadAllStores() {

	// load any stores found in stores_asmodule{} if set by args.
	for ( var st in stores_asmodules ) {
		var store_file = stores_asmodules[st];
		console.log('loadAllStores: ' + st + ' - ' + store_file);
			
		// add stores
		var this_config = {};
		this_config.name = st;
		this_config.title = st;	
		this_config.encoding = 'utf8';	
					
		stores[st] = [];
		stores[st]['config'] = this_config;

		if ( !stores[st]['config']['encoding'] ) {
			stores[st]['config']['encoding'] = 'utf8';
		}
					
		stores[st]['module'] = require(store_file);
			
			
	}
	

console.log('index@stores> _loadAllStores, stores: ' + util.inspect(stores, true, 99, true));




	// load each store with require
	// look within directory /lib/stores/ to discover available stores.
	
	// load inputs nativly through node require.
	fs.readdir(__dirname, function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(store){
			console.log('*@stores> store: ' + store);
			
			var stats = stats = fs.lstatSync(__dirname + '/' + store);
			if (stats.isDirectory()) {
				// if /lib/stores/_mystore will ignore the underscored directories.
				// NOTE: if you only want particular stores to load, underscore unwanted directories.
				if ( store.substring(0, 1) != '_' ) {
					// add store
					var this_config = require('./' + store + '/config.json');
					console.log('*@stores> store to load: ' + this_config['title']);
					
					stores[store] = [];
					
					stores[store]['config'] = this_config;
					
					if ( !stores[store]['config']['encoding'] ) {
						stores[store]['config']['encoding'] = 'utf8';
					}
					
					stores[store]['module'] = require('./' + store + '/index.js');
					//stores[store]._load('', storeid);
				}
			
			}
		
		});	
	});

}



function _loadAllReports() {

	// load each report with require
	// look within directory /lib/reports/ to discover available reports.
	
	// set reports path
	var reportspath = __dirname.substring(0, __dirname.lastIndexOf("/")) + '/reports/';
	//console.log('reportspath: ' + reportspath);
	
	// load inputs nativly through node require.
	fs.readdir(reportspath, function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(report){
			//console.log('report: ' + report);
			
			var stats = stats = fs.lstatSync(reportspath + report);
			if (stats.isDirectory()) {
				// if /lib/reports/_myreport will ignore the underscored directories.
				// NOTE: if you only want particular reports to load, underscore unwanted directories.
				if ( report.substring(0, 1) != '_' ) {
					// add store
					var this_config = require('' + reportspath + report + '/config.json');
					console.log('*@stores> report to load: ' + this_config['title']);
					
					///home/mark/Documents/kurunt/ser/kurunt/lib/reports/stream
					
					reports[report] = [];
					reports[report]['config'] = this_config;
					reports[report]['module'] = require('' + reportspath + report + '/index.js');
					reports[report]['module']._init(id);
				}
			
			}
		
		});	
	});

}


