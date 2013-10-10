//
// Kurunt Workers
//
// Workers for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


//var config 					= require("./config.json");							// config settings for this worker.

var util 							= require('util');
var messenger 				= require('./messenger');							// 

var config 						= undefined;
var topology 					= undefined;

//var topology				= require("./topology.json");	// try catch, not nessisary
var fs 								= require('fs');
var cluster 					= require('cluster');
var cp 								= require('child_process');

exports._load 				= _load;
var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	console.log('*@workers> SIGINT, stoping.');
  process.exit(0);
});

var workers = {};


process.on('message', function(m) {
	console.log('process.on.message>' + util.inspect(m, true, 99, true));
	
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	
	_load(config, topology);
	
});


/*
				cluster.setupMaster({
					exec :  __dirname + '/index.js',
					args : ["--clusterWorker"],
					silent : false
				});
*/




var processID 		= 'master#0';


// does this app run standalone or as a module?
var running_standalone = false;	// false = required as a module.
process.argv.forEach(function(val, index, array) {
	if ( val === 'forked' ) {
		console.log("*Workers, I'm forked not standalone.");
		// load topology.json from admin.
		running_standalone = false;
		//var topology 					= require("./topology.json");	
		//_load();
	}
});


if (cluster.isWorker) {
	console.log("*Workers, I'm a clusterWorker.");
	console.log('config>' + util.inspect(config, true, 99, true));
	//_load();
}







/*
var running_standalone = false;	// false = required as a module.
if ( require.main === module ) {
	console.log("called directly");
	running_standalone = true;
} else {
	console.log("required as a module");
	this._load(); 
}

// does this app run standalone or as a module?
if ( running_standalone === true ) { 
	this._load(); 
}
*/


//var x = 0;

// this function gets called when first process.on('message' is triggered, (must always have _load function).
function _load(config, topology) {
	
	if ( running_standalone === true ) {
		// copyright statement.
		console.log('Welcome to Kurunt Workers (http://kurunt.com).\nVersion '+version+' (License: MIT or Apache 2.0).\n\nCopyright (c) 2013 Mark W. B. Ashcroft.\nCopyright (c) 2013 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		//console.log('*Loading Schemas.', config);
		console.log('*@workers> Loading Workers.');
	}

if (cluster.isWorker) {

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
	
	
// funcy prototype for woker to call.
var Funcy = function() { };
Funcy.prototype.talk = function(m) { return console.log('hello FUNCY here ---- m: ' + m); };
Funcy.prototype.pause = function() { return messenger.pause() };
Funcy.prototype.resume = function() { return messenger.resume() };
var funcy = new Funcy();	// use: codec.encode(message), codec.decode(message).
 

	
	
	
	var u = 0;
	var rep = {};
	
	
	//var stream = require('stream');
	//this.readable = true;
	
	//var mxas = new createStream();
	var messages = messenger.init(config, connections);
	
	//var messages = messenger.MotionLevelStream(config, connections);
	//messages.on('message',  function(idb, downstream, message, mlen, reply) {
	messages.on('message',  function(x, message, reply) {
			//console.log('messageDUMP> ' + util.inspect(message, true, 99, true));
			
			//console.log('messages.self> ' + util.inspect(messages._this, true, 99, true));
			
			//console.log('messages> ' + util.inspect(messages, true, 99, true));
			
			var fn = funcy;
			
			
			//console.log('reply> ' + util.inspect(reply, true, 99, true));
			//console.log('x> ' + util.inspect(x, true, 99, true));
			// now route this message to it's worker.
			//console.log('route to worker: ' + message['worker']);
			
			
			// add some properties to the message
			message.encoding 				= workers[message.worker]['config']['encoding'];
			message.reports 				= workers[message.worker]['config']['reports'];
			message.worker 					= workers[message.worker]['config']['name']; 
			
			// process message by worker
			workers[message.worker]['module'].process(message, workers[message.worker]['config'], fn, function(res) {
			
				//console.log('workers> ' + util.inspect(workers, true, 99, true));
				// send message to store (or wherever) set within connections.
				//x = z;
				
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
							console.log('store x: ' + x + ' : ' + m.stores[x]);	
								if ( i === m.stores[x] ) {
									console.log('yes store for this message: ' + i);
									m.stores[x] = workers[m.worker]['config']['stores'][s];
									for ( var a in workers[m.worker]['config']['stores'][s][i]['schema'] ) {
										console.log('a: ' + a + ' : name ' + workers[m.worker]['config']['stores'][s][i]['schema'][a]['name'] + ' type ' + workers[m.worker]['config']['stores'][s][i]['schema'][a]['type'] );
					
										console.log('value: ' + attributes[workers[m.worker]['config']['stores'][s][i]['schema'][a]['name']]);
										m.stores[x][i]['schema'][a].value 		= attributes[workers[m.worker]['config']['stores'][s][i]['schema'][a]['name']];
										m.stores[x][i]['schema'][a].id 		= -1;
									}					
								}
							}
						}
					}
				
				}
	
				delete m.message;		// can now delete orgional message, as probably dont need to use it again.

				console.log('DUMPc> ' + util.inspect(m, true, 99, true));			
				
				
				messenger._send(m, function(err, res) {
					// garbage collector.
				});
				
				u++;
				
			//	if ( u > 1 ) {
					//messages.pause();
			//	}
				
				
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
					//var x = 1;
					//for ( x = 1; x < (Object.keys(message.messages).length + 1); x++ ) {
						//if ( x === 3 ) {
						//	continue;
						//}
						//console.log('message u: ' + u);
						//rep.messages.push((u).toString());  // each individual message from batch processed, as array of string representing message id number.
					//}
				}

				
			});
			
	});	
	

}
	//if ( all_zmq_connect === true ) {
		// can use cluster to fork this worker to all cpus.
		/*
		var numCPUs 			= require('os').cpus().length;
		console.log('*@workers> cluster to each cpu');
		var processes = [];
		for (var f = 0; f < numCPUs; f++) {
			console.log('FALK! f: ' + f);
			var args = [];					// process.argv
			args.push("forked");		// send i'm forked command to object.
			args.push("fork#"+f);		// send fork number.
			processes[f] = cp.fork( __dirname + '/test/index.js', args );
		}	
*/



/*
if (cluster.isMaster) {
  console.log('I am master');
  cluster.fork();
  cluster.fork();
} else if (cluster.isWorker) {
  console.log('I am worker #' + cluster.worker.id);
}
*/

		// number of cpus to use for worker cluster.
		if ( config["worker_cluster_cpu"] === '*' ) {
			var NUMCPUS = require('os').cpus().length;
		} else {
			var NUMCPUS = Number(config["worker_cluster_cpu"]);
		}

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
			_loadWorkers(cluster.worker.id);
		}
	
		
		
//	} else {
		// dont cluster just run as fork of topology.js
		
	//}
	
	
/*
	// use topology to open each schema connection for axon.
	for ( var c = 0; c < topology['connections'].length; c++ ) {
		
		console.log("messenger " + topology['connections'][c]['zmq_socket'] + ", for apikey: " + topology['connections'][c]['apikey'] + ", namespace: " + topology['connections'][c]['namespace'] + ", at: " + topology['connections'][c]['zmq_pattern'] + "@" + topology['connections'][c]['zmq_address']);
		
		messages[c] = messenger.messages(topology['connections'][c]['zmq_socket'], topology['connections'][c]['zmq_pattern'], topology['connections'][c]['zmq_address']);
		messages[c].on('message',  function(message) {
				// message has entered as object, message.message contains recieved message.
			console.log('*@schemas> got one message: ' + message + 'EOM');
			console.log('schemaDUMP> ' + util.inspect(message, true, 99, true));

		});
		
		
		

	}


*/


	loaded = true; 

}




function _loadWorkers(workerid) {

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


