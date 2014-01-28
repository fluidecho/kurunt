//
// Kurunt Stores
//
// Loads and routes messages from workers to stores for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


var messenger 				= require('./messenger');

var config 						= undefined;
var topology 					= undefined;

var fs 								= require('fs');


var logging 		= require('.././logging');


//exports._load 				= _load;
var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	logging.log(processID + '@stores> SIGINT, exit.');
  process.exit(code=0);
});



var stores = {};
var stores_asmodules = {};
var reports = {};

var fn = undefined;		// functions to pass to stores.
var cf = {};		// configs to pass to stores.


var mps = 0;
var tot = 0;


var processID = '*#' + process.pid;
var id = 0;

// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	logging.log('*stores, process.on.message>', m);
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
	//logging.log('stores> agr: ' + val);
	
	if ( val.substring(0, 8) === '-stores=' ) {
		stores_asmodules = JSON.parse(val.substring(8));
		//logging.log('stores> load these stores: ' + stores_asmodules);
		//logging.log('stores> store: ', stores_asmodules);
	}
	
});



function _init(config, topology) {

	//logging.log(processID + "@stores> initiating.");


	// fn (worker functions) prototype for woker to call.
	var Fn = function() { };
	Fn.prototype.hello = function() { return console.log('world'); };
	Fn.prototype.pause = function() { return messenger.pause() };
	Fn.prototype.resume = function() { return messenger.resume() };
	fn = new Fn();
	fn.logging = logging;		// logging functions: log, benchmark.


	_loadAllStores();
	//_loadAllReports();

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
	

		 
	setInterval(function () {		
		logging.benchmark(processID + '@stores> mps: ' + mps + ' total: ' + tot);
		mps = 0;		// reset
	}, 1000);	
	
	var u = 0;
	var rep = {};
	
	
	var messages = messenger.init(config, connections);
	messages.on('message',  function(x, message, reply) {
		//console.log('storemessageDUMP> ' + util.inspect(message, true, 99, true));
		logging.log('message> ', message);
				
		//_messages.emit('message', message);

		//console.log('index@stores> reports: ' + require('util').inspect(reports, true, 99, true));

		// route message by store
		for ( var s in message.stores ) {
		
			//console.log('*@stores> store: s' + s + ' - ' + message.stores[s] );
		
			// if store schema-d by worker. 
			if ( typeof message.stores[s] === 'object' ) {

				for ( var st in message.stores[s] ) {
					stores[st]['module'].store(message, fn, function(res) {
						// error and garbage collection.
					});
				}			
			
			} else {
			// if store un-schema-d by worker. 
				var st = message.stores[s].toString();
				stores[st]['module'].store(message, fn, function(res) {
					// error and garbage collection.
				});
		
			}

		}

		mps++;
		tot++;
			
	});	
	loaded = true; 
	process.send({ object: 'store', namespace: '*', message: 'loaded' });
}






function _loadAllStores() {

	// load any stores found in stores_asmodule{} if set by args.
	for ( var st in stores_asmodules ) {
		var store_file = stores_asmodules[st];
		//console.log('loadAllStores: ' + st + ' - ' + store_file);
			
		var store_module = require(store_file);
		var store_config = store_module.config;			
			
		//console.log('loadAllStores: ' + st + ' - ' + store_file + ' config:name: ' + store_config.name);
			
		// add stores
		var this_config = {};
		this_config.name = st;
		this_config.title = st;	
		this_config.encoding = 'utf8';	
					
		stores[store_config.name] = [];
		stores[store_config.name]['config'] = store_config;

		if ( !stores[store_config.name]['config']['encoding'] ) {
			stores[store_config.name]['config']['encoding'] = 'utf8';
		}
					
		stores[store_config.name]['module'] = store_module;
		if( typeof stores[store_config.name]['module'].init === 'function' ) {
			stores[store_config.name]['module'].init(id, cf, fn);
		}			
			
	}
	

//console.log('index@stores> _loadAllStores, stores: ' + util.inspect(stores, true, 99, true));


	// load each store with require
	// look within directory /lib/stores/ to discover available stores.
	
	// load inputs nativly through node require.
	fs.readdir(__dirname, function(err, dirs) {
		if(err) throw err;
		dirs.forEach(function(store){
			//logging.log('*@stores> store: ' + store);
			
			var stats = stats = fs.lstatSync(__dirname + '/' + store);
			if (stats.isDirectory()) {
				// if /lib/stores/_mystore will ignore the underscored directories.
				// NOTE: if you only want particular stores to load, underscore unwanted directories.
				if ( store.substring(0, 1) != '_' ) {
					// add store
					
					stores[store] = [];
					stores[store]['module'] = require('./' + store + '/index.js');
					stores[store]['config'] = stores[store]['module'].config;
					
					if ( !stores[store]['config']['encoding'] ) {
						stores[store]['config']['encoding'] = 'utf8';
					}					
					
					if( typeof stores[store]['module'].init === 'function' ) {
						stores[store]['module'].init(id, cf, fn);
					}
					
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

					///home/mark/Documents/kurunt/ser/kurunt/lib/reports/stream
					
					reports[report] = [];
					
					reports[report]['module'] = require('' + reportspath + report + '/index.js');
					
					//var this_config = require('' + reportspath + report + '/config.json');
								
					reports[report]['config'] = reports[report]['module'].config;
					logging.log('*@stores> report to load: ' + reports[report]['config']['title']);		
					
					if( typeof reports[report]['module'].init === 'function' ) {
						reports[report]['module'].init(id);
					}
				}
			
			}
		
		});	
	});

}


