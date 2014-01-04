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



var version					= 0.2;



exports.topo 				= topo;

var processes 			= []; 	// the processes falked.
exports.processes 	= processes;


function topo(config, topology, workers, stores) {

	//console.log('topology> ' + util.inspect(topology, true, 99, true));

//console.log('topology> config' + util.inspect(config, true, 99, true));


	var f = 0;

	//var x = 0;
	//for ( x = 0; x < topology['nodes'].length; x++ ) {
		//console.log('node: ' + topology['nodes'][x]);
		//console.log('node> ' + util.inspect(topology['nodes'][x], true, 99, true));
		
		var p = 0;
		for ( p = 0; p < topology['nodes'][config['this_node']]['process'].length; p++ ) {
			//console.log('process: ' + topology['nodes'][x]['process'][p]);
			//console.log('process> ' + util.inspect(topology['nodes'][config['this_node']]['process'][p], true, 99, true));
			
			//console.log('FALK this process!!! f: ' + f);
			
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
			
				config.xlog('topology> fork this proces: ' + object);

				processes[f] = cp.fork( __dirname + '/' + object, args );
				processes[f].send({ id: topology['nodes'][config['this_node']]['process'][p]['id'], config: JSON.stringify(config), topology: JSON.stringify(topology['nodes'][config['this_node']]['process'][p]) });
				//processes[f].send({ msg: 'topology', json: JSON.stringify(topology['nodes'][config['this_node']]['process'][p]) });
				
				processes[f].kurunt_object = topology['nodes'][config['this_node']]['process'][p]['object'];
				processes[f].kurunt_namespace = topology['nodes'][config['this_node']]['process'][p]['namespace'];
				
				f++;
			
			}
			
		}
		
		
//}






/*
	for ( var n in topology['nodes'] ) {
		console.log('node: ' + n);

			for ( var node in topology['nodes'][n] ) {
				console.log('node: ' + node);
				

				console.log('process> ' + util.inspect(node, true, 99, true));
				
		

			}
	
	
	
	}
*/



	return true;

}








