#!/usr/bin/env node
//
// Twitter Streaming API Client
//
// Client to revcieve messages from Twitter's Streaming API and pass onto Kurunt's ETL.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config				= require("./config.json");							// this is your config settings, like ports to open.
var version 			= 0.1;												// version number.


var https  				= require('https');
var url		 			= require('url');
var zmq 				= require('/usr/local/lib/node_modules/zmq');
var util 				= require('util');


var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

var client	 			= '';												// client connected to twitter's api.
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
		console.log('Welcome to Twitteri (input) (http://kurunt.org).\nVersion '+version+' (Apache License 2.0).\n\nCopyright (c) 2012 Mark W. B. Ashcroft.\nCopyright (c) 2012 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');
	} else {
		console.log('*Twitteri input started.');
	}

	
	// if using open_ports through sqlite (config.js) or config.json.
	if ( config['open_ports_db'] === true ) {
		var configDB = require("./config");
		configDB.openPosts(
		  function (ports_tmp) {
			ports = ports_tmp;
			if ( ports === undefined ) {
				console.log("Twitteri (input) '" + config['name'] + "' client has no ports to open, goodbye.");
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
			console.log("Twitteri (input) '" + config['name'] + "' client has no ports to open, goodbye.");
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
		var etl_port = port.replace(/"/g, "");		
		etl_port = parseInt(etl_port) + 1;
		port = parseInt(port);
	} else {
		var etl_port = port + 1;
	}

	ports.push({port: port});
	
	console.log('client: ' + client);
	
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
			log("Twitter (input) '" + config['name'] + "' disconnected from tcp://" + config['message_host'] + ":" + etl_port + ".");
			break;
		}
	}
	
	if ( ports.length == 0 ) {
		// close request connection to twitter streaming api.
		client.end();
		client.abort();
		client = '';	// so will reconnect if open() again.
	}
	
}


function connectAPI() {

	if ( ports == '' ) {
		return;																// nada.
	}

	var auth = new Buffer(config['twitter_user'] + ':' + config['twitter_pass']).toString('base64');
	//console.log('auth: ' + auth);
	
	// connect to twitter streaming api.
	
	var options = {
		host: 'stream.twitter.com',
		port: 443,
		path: '/1/statuses/sample.json',
		method: 'GET',
		headers: {
			'User-Agent': 'kurunt/0.1',
			'Authorization': 'Basic ' + auth
	   }
	};

	client = https.request(options, function(res) {
		//console.log("statusCode: ", res.statusCode);
		//console.log("headers: ", res.headers);

		//res.on('data', function(d) {
		//	process.stdout.write(d);
		//});
	});

	client.on('error', function(e) {
		console.error(e);
	});	
	
	client.on('response', clientResponse);									// on connect with response.
	client.end();	

}


function clientResponse(res) {
	
	// connected.
	console.log('Twitter API connected.');
	
	var data = '';															// the messages twitter is sending.
	var message = '';	
	res.setEncoding('utf8');												// twitter uses utf8 encoding.

	// recieving data.
	res.on('data', function(chunk) {
		data += chunk;	

		//console.log('chunk: ' + chunk);
		
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
				message_arr.handler = 'twitter';
				message_arr.client_address = '127.0.0.1';
				message_arr.client_port = 0;
				message_arr.message = message;

				var message_json = JSON.stringify(message_arr);							

				//log("MESSAGE_HANDLER for " + etl_port + "> " + message);

				// if no zmq socket for this port, open one.
				if ( sock[p] == undefined ) {
					sock[p] = zmq.socket('push');						
					sock[p].bindSync('tcp://' + config['message_host'] + ':' + etl_port);
					log("Twitter (input) '" + config['name'] + "' Client has started sending messages to ETL on tcp://" + config['message_host'] + ":" + etl_port + ".");
				}
				
				sock[p].send(message_json + "\n");							// send to zmq for processing, NOTE each message must end with LF "\n" so can deliniate individual messages!
			}

			data = '';														// reset.

		}
		
	});

	res.on('end', function() {
		connectedTwitterAPI = true;											// disconnected.
		console.log('Twitter API disconnected!');
	});

}
 