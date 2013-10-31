#!/usr/bin/env node
//
// Kurunt Stream API
//
// Stream(ing) API for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var http 						= require('http');
var config 					= require("../../.././config.json");					// global config.


var server 					= undefined;																	// server open.
var _message 				= undefined;

var clients = [];																									// array of connected clients.


module.exports.message = function (message) {
	console.log('api:stream@stores, message> ' + require('util').inspect(message, true, 99, true));
	
	for ( var client in clients ) {
		console.log('api:stream@stores> send message to clientID: ' + clients[client]['id']);
		clients[client]['res'].write( JSON.stringify(message) + '\n' );		// delineate by linefeed.
	}
	
	
};


function onRequest(request, response) {

	//console.log('api:stream@stores, request> ' + require('util').inspect(request, true, 99, true));
	//console.log('api:stream@stores, response> ' + require('util').inspect(response, true, 99, true));

	var channel	= undefined;																	// as set by apikey or tag.






/*
	// message module for stream@stores to call, exposed so reponse is client specific.
	_message = function(message) {
		console.log('api:stream@stores, _message> ' + require('util').inspect(message, true, 99, true));
	
		//console.log('tags: ' + message.tags.indexOf(channel));
	
		// send data by valid channel.
		if ( message.apikey.toString() === channel || message.tags.indexOf(channel) != -1 ) {
			console.log('api:stream@stores> write message.');
			response.write(JSON.stringify(message)+'\n');		// delineate by linefeed.
		} else {
			console.log('api:stream@stores> skip invalid message.');
		}
	};
	*/
	
	

	// if client request favicon return.
	if (request.url === '/favicon.ico') {
		response.writeHead(200, {'Content-Type': 'image/x-icon'} );
		response.end();
		return;
	}	
	
	var header = request.headers['authorization']||'',				// get the header
		auth_token = header.split(/\s+/).pop()||'',							// and the encoded auth token
		auth = new Buffer(auth_token, 'base64').toString(),			// convert from base64
		auth_parts = auth.split(/:/),														// split on colon
		auth_username = auth_parts[0],													// coresponds to the data's apikey requesting.
		auth_password = auth_parts[1];													// match against config['stream_api_pass'].

	// validate password is either: pass or config['streaming_api_password'].
	if ( config['stream_api_pass'] != auth_password ) {
		response.writeHead(401, {'WWW-Authenticate': 'Basic realm="Kurunt Stream API"', 'Content-Type': 'application/json', 'Connection': 'closed'});
		response.end('{"message":"not valid auth"}\n');
		return;
	}
	
	
	//client.push();
	
	channel = auth_username;																	// set client suth username for the data's apikey or tag. 
	
	var clientID = clients.length;
	

	// route message based on username as apikey.
	console.log('api:stream@stores> Valid user, username is "'+auth_username+'" and password is "'+auth_password+'"');	
	
	var ip = _ipAddress(request);		// get the requestors ip address.

	console.log('api:stream@stores> Client connect. Last request for: ' + request.url + ' by ip: ' + ip + ' clientID: ' + clientID);

	request.connection.addListener('close', function () {
		console.log('api:stream@stores> Client closed. Last request for: ' + request.url + ' by ip: ' + ip);
	});	
			
	response.writeHead(200, {'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked', 'Connection': 'keep-alive'});			

	// set client within client array so can broadcast messages to each (as in: message function).
	clients[clientID] = [];
	clients[clientID]['id'] = clientID;
	clients[clientID]['res'] = response;
	clients[clientID]['channel'] = channel;


	request.connection.addListener('close', function () {
		// remove this client from clients array.
  	console.log('api client closed!!! clientID: ' + clientID);
  	clients.splice(clientID, 1);
  });

} // end onReceive.



if ( config['stream_api'] === true ) {
	server = http.createServer(onRequest).listen(config['stream_api_port']);			// Start a HTTP Server.
	console.log("api:stream@stores> Stream API Server has opened on port " + config['stream_api_port'] + ".");
} else {
	console.log("api:stream@stores> Stream API is closed.");
}












function _ipAddress(request) {
	// try request.connection.socket.remoteAddresponses for https, request.socket.remoteAddresponses works for most http but request.connection.remoteAddress seems more reliable.
	var ip = undefined;
	try {
		ip = request.headers['x-forwarded-for'];
		if ( ip === undefined ) {
			ip = _remoteAddress(request);
		}
	} catch ( err ) {
		ip = _remoteAddress(request);	
	}
	return ip;
}
function _remoteAddress(request) {
	var ip = undefined;
	ip = request.connection.remoteAddress;
	if ( ip === undefined ) {
		ip = request.socket.remoteAddresponses;
		if (ip === undefined) {
			return false;
		}
	}
	return ip;	
}

