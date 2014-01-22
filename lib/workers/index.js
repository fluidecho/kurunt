//
// Kurunt Workers
//
// Loads and routes messages from inputs to workers for Kurunt.
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
var os 								= require('os');

var logging 		= require('.././logging');


var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	//logging.log(processID + '@workers> SIGINT, exit.');
  process.exit(code=0);
});


var workers = {};
var workers_asmodules = {};

var mps = 0;
var tot = 0;


var processID = '*#' + process.pid;
var pid = 0;
var this_hosts = ['127.0.0.1'];

var init = false;	

// listen for topology.js to set config and topology then load this.
process.on('message', function(m, func) {
	logging.log('*workers, process.on.message>', m);

	if ( m.id !== undefined ) {
		processID = '*#' + m.id;
		pid = m.id;
	}
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	

	//if ( m.newWorker === true ) {
	//	newWorker(func);
	//	return;
	//}	


	if ( init === false ) {
		init = true;		// has now initied dont call again.
		_init(pid, config, topology);
	}	

});



// does this app run standalone.
process.argv.forEach(function(val, index, array) {
	logging.log('workers> agr: ' + val);
	
	if ( val === 'standalone' ) {
		//logging.log("*@workers> I'm standalone.");
		var config 				= require('../.././config.json');
		var topology 			= require('../.././topology.json');
		
		var p = 0;
		for ( p = 0; p < topology['nodes'][config['this_node']]['process'].length; p++ ) {
			if ( topology['nodes'][config['this_node']]['process'][p]['object'] === 'worker' ) {
				var this_topology = topology['nodes'][config['this_node']]['process'][p];
				break;
			}
			
		}
		
		_init(0, config, this_topology);
	}
	
	if ( val.substring(0, 9) === '-workers=' ) {
		workers_asmodules = JSON.parse(val.substring(9));
		logging.log('workers> load these workers: ' + workers_asmodules);
		//logging.log('workers> workers: ', false, workers_asmodules);
	}
	
});




function _init(pid, config, topology) {

	logging.log(processID + "@workers> initiating.");

	// get this host ip, for adding to message meta.
	var interfaces = os.networkInterfaces();
	for (k in interfaces) {
		for (k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family == 'IPv4' && !address.internal) {
				this_hosts.push(address.address);
			}
		}
	}


_loadAllWorkers();

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
	fn.logging = logging;
		 
	setInterval(function () {		
		logging.benchmark(processID + '@workers> mps: ' + mps + ' total: ' + tot);
		mps = 0;		// reset
	}, 1000);	
	
	var u = 0;
	var rep = {};
	
	var messages = messenger.init(config, connections);
	messages.on('message',  function(x, message, reply) {

		logging.log('index@workers dump pre> ', message);
			
		// add some properties to the message
		message.encoding 				= workers[message.worker]['config']['encoding'];
		//message.reports 				= workers[message.worker]['config']['reports'];
		message.worker 					= workers[message.worker]['config']['name']; 		// name of worker (will override with name and id later).
			
		// process message by worker
		workers[message.worker]['module'].work(message, workers[message.worker], fn, function(res) {

			logging.log('index@workers res> ', res);

			// will skip over if res is false.
			if ( res ) {

				// schema the message!
				var m = res[0];
				var attributes = res[1];
				//console.log('index@workers> attributes: ' + util.inspect(attributes, true, 99, true));
			
				// if no attributes returned assumed the worker set them manually!
				if ( attributes != null ) {
						// set attributes to message by case sensative name.
	
	
	
					// stores are an array:
					for ( var store in workers[m.worker]['config']['stores'] ) {

						//console.log('store: ' + store);

						// the store is a collection of objects within schema.
	
						for ( var i in workers[m.worker]['config']['stores'][store] ) {
	
							//console.log('i: ' + i);
		
							for ( var x = 0; x < m.stores.length; x++ ) {
								//console.log('store x: ' + x + ' : ' + m.stores[x]);
								if ( i === m.stores[x] ) {
									//console.log('yes store for this message: ' + i);
				
									m.stores[x] = workers[m.worker]['config']['stores'][store];
									//console.log('index@workers m.stores[x]> ' + util.inspect(m.stores[x], true, 99, true));
				
									// schema items are a collection of objects, key = name of object.
									var schemaItems = Object.keys(workers[m.worker]['config']['stores'][store][i]['schema']);
									//console.log('index@workers schemaItems> ' + util.inspect(schemaItems, true, 99, true));
				
									schemaItems.forEach(function(item) {
										//console.log(item + '=' + schemaItems[item]);
					
										//console.log('index@workers> attr: ' + util.inspect(attributes[item], true, 99, true));
					
										m.stores[x][i]['schema'][item].value 		= attributes[item];
										m.stores[x][i]['schema'][item].id 			= -1;
					
									});
				
								}
							}
	
						}

					}	
	
					//console.log('index@workers m> ' + util.inspect(m, true, 99, true));
				}		// end if no attributes.
				
				

	
				m.worker = { "object": workers[message.worker]['config']['name'], "id": pid, "hosts": this_hosts }; 		// set worker name and id.
			
				delete m.message;		// can now delete orgional message, as probably dont need to use it again.	
	
				//console.log('index@workers m> ' + util.inspect(m, true, 99, true));			
				
				//console.log('index@workers m> ' + JSON.stringify(m));
				
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
						//logging.log('commited this message: ' );
						//console.log('reply> ' + util.inspect(rep, true, 99, true));
						reply(rep);
					}
				}

			}		// end if res.

		});
			
	});	
	
	loaded = true;
	process.send({ object: 'worker', namespace: '*', message: 'loaded' });
	
}



function _loadAllWorkers() {



	// load any workers found in workers_asmodules{} if set by args.
	for ( var wk in workers_asmodules ) {
		var worker_file = workers_asmodules[wk];
		
		var worker_module = require(worker_file);
		var worker_config = worker_module.config;
		//console.log('loadAllWorkers: ' + wk + ' - ' + worker_file + ' config:name: ' + worker_config.name);
			
		workers[worker_config.name] = [];
		workers[worker_config.name]['module'] = worker_module;
		workers[worker_config.name]['config'] = worker_config;
		if ( !workers[worker_config.name]['config']['encoding'] ) {
			workers[worker_config.name]['config']['encoding'] = 'utf8';
		}

		// add worker
		//var this_config = require('./' + worker + '/config.json');
		//console.log('worker to load: ' + this_config['title']);
		//var this_config = {};
		//this_config.name = wk;
		//this_config.title = wk;	
		//this_config.encoding = 'utf8';	
		/*		
		workers[wk] = [];
	
		workers[wk]['module'] = require(worker_file);
		
		workers[wk]['config'] = workers[wk]['module'].config;
		if ( !workers[wk]['config']['encoding'] ) {
			workers[wk]['config']['encoding'] = 'utf8';
		}		
		*/
	}


	logging.log('index@workers> _loadAllWorkers, workers: ', workers);



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
					workers[worker] = [];
					
					workers[worker]['module'] = require('./' + worker + '/index.js');
					//workers[worker]._load('', workerid);					
					
					//var this_config = require('./' + worker + '/config.json');
					workers[worker]['config'] = workers[worker]['module'].config;
					//logging.log('worker to load: ' + workers[worker]['config']['title']);
					
					//workers[worker] = [];
					//workers[worker]['config'] = this_config;

					if ( !workers[worker]['config']['encoding'] ) {
						workers[worker]['config']['encoding'] = 'utf8';
					}
					

					
					if (typeof workers[worker]['module'].init === 'function') {
						workers[worker]['module'].init();		// load init worker function if exists.
					}					
					
					w++;
				}
			
			}
		
		});	
	});

}

