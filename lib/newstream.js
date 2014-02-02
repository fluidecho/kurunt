//
// Kurunt newStream API
//
// Create a new stream via Kurunt API.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var crypto 					= require('crypto');
var httpconfig 			= require('./inputs/http/config.json');		// need for getting http input port.

var last_input_port = 7000;		// the port number to start for each apikey using tcp or udp, asmodule use 7000+, admin uses 6000+.

var api_config 			= require('./stores/stream/config.json');


module.exports._new = function (config, processes, input, worker, stores, tags, access_hosts, newstreamCB) {

	var newstream = {};

		
	// NOTE: by default tcp issues port sequentially from 6001 and udp from 7001, http using random 16 char md5 hash.
	var apikey = undefined;
	if ( input === 'tcp' || input === 'udp' ) {
		last_input_port++;
		apikey = last_input_port;
	} else {
		// http or other input type
		apikey = crypto.createHash('md5').update(Math.random().toString()).digest("hex").toString().substring(0,16);
	}

					
	newstream.apikey = apikey;
	newstream.input = { object: input, id: 0 };
	newstream.worker = worker;
	newstream.stores = stores;

	//newstream.reports = reports;
	//newstream.reports.push('stream');
										
	newstream.tags = tags;
	newstream.access_hosts = access_hosts;														
	newstream.status = 'open';
	newstream.host = config['host'];
	
	if ( input === 'http' ) {
		newstream.address = input + '://' + config['host'] + ':' + httpconfig['input_port'] + '/' + apikey + '/';
	} else if ( input === 'tcp' ) {
		newstream.address = input + '://' + config['host'] + ':' + apikey;
	} else if ( input === 'udp' ) {
		newstream.address = input + '://' + config['host'] + ':' + apikey;
	}

	newstream.api_address = 'http://' + apikey + ':' + api_config['stream_api_pass'] + '@' + config['host'] + ':' + api_config['stream_api_port'];


	//console.log('newstream.js> workerFunction: ' + util.inspect(workerFunction, true, 99, true));

	for ( var p in processes ) {
		if ( processes[p]['kurunt_object'] === 'input' ) {
			processes[p].send({ newStream: JSON.stringify(newstream) });		// new.
		}
	}
	
	
	return newstreamCB(newstream);

};


