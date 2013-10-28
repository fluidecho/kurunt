//
// Topology
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



// load dependencies.
var util 						= require('util');
var fs 							= require('fs');
var cp 							= require('child_process');



var version					= 0.2;



exports.topo 				= topo;

var processes 			= []; 	// the processes falked.



function topo(config, topology) {

	//console.log('topology> ' + util.inspect(topology, true, 99, true));




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
			
			// 'ignore' can be set to = true and will not falk that process.
			if ( topology['nodes'][config['this_node']]['process'][p]['ignore'] === undefined || topology['nodes'][config['this_node']]['process'][p]['ignore'] === false ) {
			
				if ( topology['nodes'][config['this_node']]['process'][p]['namespace'] === '*' ) {
					var object = topology['nodes'][config['this_node']]['process'][p]['object'] + 's/index.js';
				} else {
					var object = topology['nodes'][config['this_node']]['process'][p]['object'] + 's/' + topology['nodes'][config['this_node']]['process'][p]['namespace'] + '/index.js';
				}

				var args = [];					// process.argv
				args.push("forked");		// send i'm forked command to object.
			
				console.log('topology> fork this proces: ' + object);
				processes[f] = cp.fork( __dirname + '/' + object, args );
				processes[f].send({ id: topology['nodes'][config['this_node']]['process'][p]['id'], config: JSON.stringify(config), topology: JSON.stringify(topology['nodes'][config['this_node']]['process'][p]) });
				//processes[f].send({ msg: 'topology', json: JSON.stringify(topology['nodes'][config['this_node']]['process'][p]) });
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








