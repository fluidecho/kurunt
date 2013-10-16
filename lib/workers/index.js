//
// Kurunt Workers
//
// Loads and routes messages to workers for Kurunt.
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

exports._load 				= _load;
var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	console.log(processID + '@workers> SIGINT, exit.');
  process.exit(code=0);
});


var workers = {};


var mps = 0;
var tot = 0;


// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log('*workers, process.on.message>' + util.inspect(m, true, 99, true));
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	_load(config, topology);
});


var processID = 'master#0';


function _load(config, topology) {
	
	console.log('*@workers> Loading Workers.');
	
	if ( cluster.isWorker ) {	
		_init();
	}

	// number of cpus to use for worker cluster.
	if ( topology["cluster"] === true ) {
		if ( topology["cluster_cpus"] === '*' ) {
			var NUMCPUS = require('os').cpus().length;
		} else {
			var NUMCPUS = Number(topology["cluster_cpus"]);
		}
	} else {
		var NUMCPUS = 0;
		processID = 'master#1';		// if not using cluster then this process becomes master # 1 and the only worker process.
		console.log('I am master #1');	 // master.
		_loadAllWorkers();
		_init();
	}
	console.log('NUMCPUS:' + NUMCPUS);

	if (cluster.isMaster) {
		// Fork workers.
		for (var i = 0; i < NUMCPUS; i++) {
		//for (var i = 0; i < 1; i++) {
			console.log('FALK!');
			var worker = cluster.fork();
			worker.send({ config: JSON.stringify(config), topology: JSON.stringify(topology) });
		}
		cluster.on('exit', function(worker, code, signal) {
			var exitCode = worker.process.exitCode;
			
			console.log("worker.exit> worker was killed by signal: " + signal + " exitCode: " + exitCode);
			
			if ( exitCode !== 0 ) {
				console.log('worker ' + worker.process.pid + ' died ('+exitCode+'). restarting... x: '  );
				//var worker = cluster.fork();
				//worker.send({ config: JSON.stringify(config), topology: JSON.stringify(topology) });
			} else {
				console.log('worker ' + worker.process.pid + ' exited ('+exitCode+').');
			}
			
		});
	} else {
		processID = 'worker#' + cluster.worker.id;
		console.log('I am worker #' + cluster.worker.id);	 // Worker.
		_loadAllWorkers();
	}
	
	loaded = true; 

}


function _init() {

	console.log("*@workers> initiating.");

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
	Fn.prototype.hello = function(m) { return console.log('world'); };
	Fn.prototype.pause = function() { return messenger.pause() };
	Fn.prototype.resume = function() { return messenger.resume() };
	var fn = new Fn();
		 
	setInterval(function () {		
		console.log(processID + '@workers> mps: ' + mps + ' total: ' + tot);
		mps = 0;		// reset
	}, 1000);	
	
	var u = 0;
	var rep = {};
	
	var messages = messenger.init(config, connections);
	messages.on('message',  function(x, message, reply) {
				//console.log('messageDUMP> ' + util.inspect(message, true, 99, true));
			
		// add some properties to the message
		message.encoding 				= workers[message.worker]['config']['encoding'];
		message.reports 				= workers[message.worker]['config']['reports'];
		message.worker 					= workers[message.worker]['config']['name']; 
			
		// process message by worker
		workers[message.worker]['module'].work(message, workers[message.worker]['config'], fn, function(res) {

			// schema the message!
			var m = res[0];
			var attributes = res[1];
			
			// if no attributes returned assumed the worker set them manually!
			if ( attributes != null ) {
					// set attributes to message by case sensative name.
	
				// for each stores schema attribute in config.json.
				for ( var s in workers[m.worker]['config']['stores'] ) {
					//console.log('stores s> ' + s + util.inspect(config['stores'][s], true, 99, true));
					for ( var i in workers[m.worker]['config']['stores'][s] ) {
						//console.log('i: ' + i + ' : ' + config['stores'][s][i]['schema']);
						for ( var x = 0; x < m.stores.length; x++ ) {
						//for ( var x in message.stores ) {
						//console.log('store x: ' + x + ' : ' + m.stores[x]);	
							if ( i === m.stores[x] ) {
								//console.log('yes store for this message: ' + i);
								m.stores[x] = workers[m.worker]['config']['stores'][s];
								for ( var a in workers[m.worker]['config']['stores'][s][i]['schema'] ) {
									//console.log('a: ' + a + ' : name ' + workers[m.worker]['config']['stores'][s][i]['schema'][a]['name'] + ' type ' + workers[m.worker]['config']['stores'][s][i]['schema'][a]['type'] );
									//console.log('value: ' + attributes[workers[m.worker]['config']['stores'][s][i]['schema'][a]['name']]);
									m.stores[x][i]['schema'][a].value 		= attributes[workers[m.worker]['config']['stores'][s][i]['schema'][a]['name']];
									m.stores[x][i]['schema'][a].id 		= -1;
								}					
							}
						}
					}
				}
				
			}
	
			delete m.message;		// can now delete orgional message, as probably dont need to use it again.
				
			messenger.send(m, function(err, res) {
				// garbage collector.
				mps++;
				tot++;
			});
				
			u++;
				
			// expreimental feature for guaranteed message delivery!
			if ( reply !== undefined ) {
				if ( u === 1 ) {
					delete rep;
					rep = {};
					rep.idb = x.idb;
					rep.messages = [];
					rep.downstream = x.downstream;
				}
				rep.messages.push(u.toString());
				if ( u === x.mLen ) {
					u = 0;
					console.log('commited this message: ' );
					//console.log('reply> ' + util.inspect(rep, true, 99, true));
					reply(rep);
				}
			}

		});
			
	});	

}



function _loadAllWorkers() {

	var w = 0;
	// load each worker with require
	// look within directory /lib/workers/ to discover available workers.
	
	// load inputs nativly through node require.
	fs.readdir(__dirname, function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(worker){
			//console.log('worker: ' + worker);
			
			var stats = stats = fs.lstatSync(__dirname + '/' + worker);
			if (stats.isDirectory()) {
				// if /lib/workers/_myworker will ignore the underscored directories.
				// NOTE: if you only want particular workers to load, underscore unwanted directories.
				if ( worker.substring(0, 1) != '_' ) {
					// add worker
					var this_config = require('./' + worker + '/config.json');
					console.log('worker to load: ' + this_config['title']);
					
					workers[worker] = [];
					
					workers[worker]['config'] = this_config;
					
					if ( !workers[worker]['config']['encoding'] ) {
						workers[worker]['config']['encoding'] = 'utf8';
					}
					
					workers[worker]['module'] = require('./' + worker + '/index.js');
					//workers[worker]._load('', workerid);
					w++;
				}
			
			}
		
		});	
	});

}


