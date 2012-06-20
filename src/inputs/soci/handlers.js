//
// Soci Handler
//
// Handles messages by client host or open port then pushes to zmq.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Analumic.
//


// uses https://github.com/JustinTulloss/zeromq.node - install: npm install zmq [-g]
// you could of cause modify this to send messages directly to say a db (mysql, mongo etc) instead of zmq.


var config				= require("./config.json");							// your config settings, like ports to open.
var zmq 				= require('/usr/local/lib/node_modules/zmq');
var sock 				= [];												// sockets that are open to zmq.


var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

//var sock = zmq.socket('push');
//sock.bindSync('tcp://*:' + config['send_port']);


// handler for all open ports or all client hosts.
function all(rAddress, rPort, message, port) {

	var etl_port = port + 1;												// etl are +1 from open port number.

	// if no zmq socket for this port, open one.
	var portStr = '"' + port + '"';
	if ( sock[portStr] == undefined ) {
		sock[portStr] = zmq.socket('push');						
		sock[portStr].bindSync('tcp://' + config['message_host'] + ':' + etl_port);
		log("Soci (input) '" + config['name'] + "' Server has started sending messages to ETL on tcp://" + config['message_host'] + ":" + etl_port + ".");
	}

	message = message.toString(config['message_encoding']);
	
	log("MESSAGE_HANDLER on " + port + ", * - " + rAddress + ':' + rPort + "> " + message);
	
	var message_arr = {}; 
	message_arr.port = port;
	message_arr.handler = "*";
	message_arr.client_address = rAddress;
	message_arr.client_port = rPort;
	message_arr.message = message;   
	  
	var message_json = JSON.stringify(message_arr);
	//log('message_json: ' + message_json);	
	
	//sock.send(port + ' - ' + rAddress + ':' + rPort + '>' + message);		// message to send to zmq for processing.
	sock[portStr].send(message_json);										// send to zmq for processing.
	
	/* 
	// it's posiable that you'll recieve multiple messages within one send, so can split by return and loop for each individual message.
	var lines = [];
	var l = 0;
	lines = message.split(/\n/g);	// standard syslog messages use LF delimiter (\n), but for more support could use: /\r\n|\r|\n/g
	for ( l in lines ) {
		if ( lines[l] == '' ) {
			continue;
		}
		log("MESSAGE_HANDLER on " + port + ", * - " + rAddress + ':' + rPort + "> " + lines[l]);
		sock.send(port + ' - ' + rAddress + ':' + rPort + '>' + lines[l]);			// message to send to zmq for processing.
	}
 */
}


// example of client host specific handler.
function host_10_10_10_10(rAddress, rPort, message, port) {
	log("MESSAGE_HANDLER on " + port + ", host_10_10_10_10 - " + rAddress + ':' + rPort + "> " + message);
	sock.send(port + ' 10.10.10.10 ' + rAddress + ':' + rPort + '>' + message);		// message to send to zmq for processing.
}


// example of open port specific handler.
function port_9999(rAddress, rPort, message, port) {
	log("MESSAGE_HANDLER on " + port + ", port_9999 - " + rAddress + ':' + rPort + "> " + message);
	sock.send(port + ' - ' + rAddress + ':' + rPort + '>' + message);				// message to send to zmq for processing.
}


exports.all = all;									// expose.
exports.host_10_10_10_10 = host_10_10_10_10;		// expose.
exports.port_9999 = port_9999;						// expose.