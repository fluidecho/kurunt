#!/usr/bin/env node
//
// Digg Streaming API Client
//
// Client to revcieve messages from Digg's Streaming API and pass onto Kurunt's ETL.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config				= require("./config.json");							// this is your config settings, like ports to open.
var version 			= 0.1;												// version number.


var http 				= require('http');
var url		 			= require('url');
var zmq 				= require('/usr/local/lib/node_modules/zmq');
var util 				= require('util');


var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

var client	 			= '';												// client connected to digg's api.
var ports				= [];												// ports that are open, + 1 to kurunt ETL.
var sock 				= [];												// sockets that are open to zmq.


//
// required functions	:-
//
// _load				: called when kurunt starts (always).
// open					: called to open a port.
// close				: called to close a port.
//
// exposes functions	:
exports._load 			= _load;
exports.open			= open;
exports.close			= close;


// does this app run standalone or as a module?
if ( config['run_standalone'] === true ) { this._load(); }


function _load() {

	if ( config['run_standalone'] === true ) {
		// copyright statement.
		console.log('Welcome to Diggi (input) (http://kurunt.org).\nVersion '+version+' (Apache License 2.0).\n\nCopyright (c) 2012 Mark W. B. Ashcroft.\nCopyright (c) 2012 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		console.log('*Diggi input started.');
	}

	
	// if using open_ports through sqlite (config.js) or config.json.
	if ( config['open_ports_db'] === true ) {
		var configDB = require("./config");
		configDB.openPosts(
		  function (ports_tmp) {
			ports = ports_tmp;
			if ( ports === undefined ) {
				console.log("Diggi (input) '" + config['name'] + "' client has no ports to open, goodbye.");
				if ( config['run_standalone'] === true ) {
					process.exit(0);  										// exit
				}
				return;														// return, do nada.
			}			
			connectAPI();
		});
	} else {
		ports = config['open_ports'];
		if ( ports === undefined ) {
			console.log("Diggi (input) '" + config['name'] + "' client has no ports to open, goodbye.");
			if ( config['run_standalone'] === true ) {
				process.exit(0);  											// exit
			}
			return;															// return, do nada.
		}		
		connectAPI();
	}	
	
}


function open(port) {
	
	if ( typeof (port) == 'string' ) {
		// make sure port int.
		//var etl_port = port.replace(/"/g, "");		
		//etl_port = parseInt(etl_port) + 1;
		port = parseInt(port);
	} else {
		//var etl_port = port + 1;
	}

	ports.push({port: port});
	
	if ( client == '' ) {
		connectAPI();
	}

}


function close(port) {

	if ( typeof (port) == 'string' ) {
		// make sure port int.
		var etl_port = port.replace(/"/g, "");		
		etl_port = parseInt(etl_port) + 1;
		port = parseInt(port);
	} else {
		var etl_port = port + 1;
	}

	var x = 0;
	for ( x in ports ) {
		if ( ports[x]['port'] == port ) {
			ports.splice(x,1);
			log("Digg (input) '" + config['name'] + "' disconnected from tcp://" + config['message_host'] + ":" + etl_port + ".");
			break;
		}
	}
	
	if ( ports.length == 0 ) {
		// close request connection to digg streaming api.
		client.end();
		client.abort();
		client = '';
	}
	
}


function connectAPI() {

	if ( ports == '' ) {
		return;																// nada.
	}

	// connect to digg streaming api.
	var parsedUrl = url.parse('http://services.digg.com/2.0/stream');
	var createClient = http.createClient(80, parsedUrl.hostname);
	client = createClient.request(parsedUrl.pathname, {'host': parsedUrl.hostname, 'User-Agent': 'kurunt/0.1'});
	client.on('error', function(e) {
	  console.log('ERR: Digg client: ' + e.message);						// client error.
	});
	client.on('response', clientResponse);									// on connect with response.
	client.end();
	
}


function clientResponse(res) {
	
	// connected.
	console.log('Digg API connected.');
	
	var data = '';															// the messages digg is sending.
	var message = '';	
	res.setEncoding('utf8');												// digg uses utf8 encoding.

	// recieving data.
	res.on('data', function(chunk) {
		data += chunk;		

		// put together chunks to form whole json messages before forwarding to kurunt.
		if ( data.indexOf('\n') != -1 ) {
			message = data;
			//console.log('MESSAGE!' + message);

			// send message to zmq.
			message = message.toString(config['message_encoding']);

			// send message to each open port in config 'port'.
			var p = 0;
			for ( p in ports ) {

				var etl_port = ports[p]['port'] + 1;						// etl are +1 from open port number.	
				
				var message_arr = {}; 
				message_arr.port = ports[p]['port'];
				message_arr.handler = 'digg';
				message_arr.client_address = '127.0.0.1';
				message_arr.client_port = 0;
				message_arr.message = message + "\n";						// NOTE each message must end with LF "\n" so can deliniate individual messages!

				var message_json = JSON.stringify(message_arr);							

				//log("MESSAGE_HANDLER for " + etl_port + "> " + message);
				//log("MESSAGE_HANDLER for " + etl_port + "> ");
				// if no zmq socket for this port, open one.
				//console.log('DUMP> ' + util.inspect(sock[p], true, 99, true));
				if ( sock[p] == undefined ) {
					sock[p] = zmq.socket('push');						
					sock[p].bindSync('tcp://' + config['message_host'] + ':' + etl_port);
					log("Digg (input) '" + config['name'] + "' Client has started sending messages to ETL on tcp://" + config['message_host'] + ":" + etl_port + ".");
				}
				
				sock[p].send(message_json);									// send to zmq for processing.
			}

			data = '';														// reset.

		}
	});

	res.on('end', function() {
		connectedDiggAPI = true;											// disconnected.
		console.log('Digg API disconnected!');
	});

}