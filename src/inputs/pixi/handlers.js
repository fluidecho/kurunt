//
// Pixi Handler
//
// Handles messages by client ip or open port then pushes to zmq.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Analumic.
//


// uses https://github.com/JustinTulloss/zeromq.node - install: npm install zmq [-g]
// you could of cause modify this to send messages directly to say a db (mysql, mongo etc) instead of zmq.


var config							= require("./config.json");							// your config settings, like ports to open.
var zmq 							= require('/usr/local/lib/node_modules/zmq');
var sock 							= [];												// sockets that are open to zmq.


var log = function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };


// handler for all open ports or all client hosts.
function all(ip, message, port, request) {

	var etl_port = port + 1;															// etl are +1 from open port number.

	// if no zmq socket for this port, open one.
	var portStr = '"' + port + '"';
	if ( sock[portStr] == undefined ) {
		sock[portStr] = zmq.socket('push');						
		sock[portStr].bindSync('tcp://' + config['message_host'] + ':' + etl_port);
		log("Pixi (input) '" + config['name'] + "' Server has started sending messages to ETL on tcp://" + config['message_host'] + ":" + etl_port + ".");
	}

	log("MESSAGE_HANDLER on " + port + ", * - " + ip + "> " + message);
	
	var message_arr 				= {}; 
	message_arr.port 				= port;
	message_arr.handler 			= "*";
	message_arr.client_address 		= ip;
	message_arr.client_port 		= 80;
	
	// pixel message details.
	message_arr.cookie				= request.headers.cookie;	
	message_arr.request 			= request.url;	
	message_arr.referer				= request.headers.referer;
	message_arr.language			= request.headers['accept-language'];	
	message_arr.user_agent			= request.headers['user-agent'];
	
	// current UTC datetime unix stamp.
	var now 						= new Date(); 
	var nowUTC 						= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	var nowUTCUnix 					= parseInt(nowUTC / 1000);							// unix timestamp.
	//log('nowUTCUnix: ' + nowUTCUnix);	
	message_arr.time				= nowUTCUnix;

	// current UTC datetime unix stamp as current hour.
	var nowUTChour 					= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), 0, 0);
	var nowUTChourUnix 				= parseInt(nowUTChour / 1000);						// unix timestamp.
	//log('nowUTChourUnix: ' + nowUTChourUnix);	
	message_arr.time_hour			= nowUTChourUnix;
	
	message_arr.message 			= message + "\n";									// "pixel\n" - NOTE each message must end with LF "\n" so can deliniate individual messages!

	var message_json = JSON.stringify(message_arr);
	//log('message_json: ' + message_json);	
	
	//sock.send(port + ' - ' + rAddress + ':' + rPort + '>' + message);					// message to send to zmq for processing.
	sock[portStr].send(message_json);													// send to zmq for processing.
	
}


// example of client ip specific handler.
function ip_10_10_10_10(ip, message, port, request) {
	log("MESSAGE_HANDLER on " + port + ", ip_10_10_10_10 - " + ip + "> " + message);
	sock.send(port + ' 10.10.10.10 ' + ip + '>' + message);								// message to send to zmq for processing.
}


// example of open port specific handler.
function port_9999(ip, message, port, request) {
	log("MESSAGE_HANDLER on " + port + ", port_9999 - " + ip + "> " + message);
	sock.send(port + ' - ' + ip + '>' + message);										// message to send to zmq for processing.
}


// expose.
exports.all = all;
exports.ip_10_10_10_10 = ip_10_10_10_10;
exports.port_9999 = port_9999;