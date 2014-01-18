//
// Topology
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



// load dependencies.
var util 						= require('util');
var fs 							= require('fs');
var cp 							= require('child_process');


var logging 		= require('./logging');

var version					= 0.2;



exports.topo 				= topo;

var processes 			= []; 	// the processes falked.
//exports.processes 	= processes;


function topo(config, topology, workers, stores, cb) {

	//console.log('topology> ' + util.inspect(topology, true, 99, true));
	//console.log('topology> config' + util.inspect(config, true, 99, true));

	var f = 0;
	var r = 0;		// process that has returned 'loaded'.
		var p = 0;
		for ( p = 0; p < topology['nodes'][config['this_node']]['process'].length; p++ ) {
			//console.log('process: ' + topology['nodes'][x]['process'][p]);
			//console.log('process> ' + util.inspect(topology['nodes'][config['this_node']]['process'][p], true, 99, true));
			
			// 'falk' can be set to = false and will not falk that process.
			if ( topology['nodes'][config['this_node']]['process'][p]['falk'] === true ) {
			
				if ( topology['nodes'][config['this_node']]['process'][p]['namespace'] === '*' ) {
					var object = topology['nodes'][config['this_node']]['process'][p]['object'] + 's/index.js';
				} else {
					var object = topology['nodes'][config['this_node']]['process'][p]['object'] + 's/' + topology['nodes'][config['this_node']]['process'][p]['namespace'] + '/index.js';
				}

				var args = [];					// process.argv
				args.push("forked");		// send i'm forked command to object.
				if ( workers != undefined ) {
					args.push("-workers=" + JSON.stringify(workers));
				}
				if ( stores != undefined ) {
					args.push("-stores=" + JSON.stringify(stores));
				}
			
				logging.log('topology> fork this proces: ' + object);

				processes[f] = cp.fork( __dirname + '/' + object, args );
				
				processes[f].on('message', function(m) {
  				//console.log('PARENT got message:', m);
  				if ( m.message === 'loaded' ) {
  					r++;
   					if ( topology['nodes'][config['this_node']]['process'].length === r ) {
  						return cb(processes);
  					} 					
  				}
				});

				processes[f].send({ id: topology['nodes'][config['this_node']]['process'][p]['id'], config: JSON.stringify(config), topology: JSON.stringify(topology['nodes'][config['this_node']]['process'][p]) });
				processes[f].kurunt_object = topology['nodes'][config['this_node']]['process'][p]['object'];
				processes[f].kurunt_namespace = topology['nodes'][config['this_node']]['process'][p]['namespace'];
				
				f++;
			
			}
			
		}

}

