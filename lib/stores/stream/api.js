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

var http = require('http');
var util 					= require('util');


var config = [];
config['stream_api_password'] = 'pass';

var server 				= undefined;												// server open.
var obj = {};
obj.hello = "world";


var clients = [];

var Messages = require('.././index.js');


function onRequest(request, response) {


	// if client request favicon return.
	if (request.url === '/favicon.ico') {
		response.writeHead(200, {'Content-Type': 'image/x-icon'} );
		response.end();
		return;
	}	
	
	var header = request.headers['authorization']||'',			// get the header
		auth_token = header.split(/\s+/).pop()||'',			// and the encoded auth token
		auth = new Buffer(auth_token, 'base64').toString(),		// convert from base64
		auth_parts = auth.split(/:/),						// split on colon
		auth_username = auth_parts[0],
		auth_password = auth_parts[1];

	// validate password is either: pass or config['streaming_api_password'].
	if ( config['stream_api_password'] != auth_password ) {
		response.writeHead(401, {'WWW-Authenticate': 'Basic realm="Kurunt Stream API"', 'Content-Type': 'application/json', 'Connection': 'closed'});
		response.end('{"message":"not valid auth"}\n');
		return;
	}

	// route message based on username as apikey.
	console.log('Valid user, username is "'+auth_username+'" and password is "'+auth_password+'"');	
	

	var ip = _ipAddress(request);
	//clients.push(ip);

	console.log('Client connect. Last request for: ' + request.url + ' by ip: ' + ip);

	
	
	request.connection.addListener('close', function () {
		console.log('Client closed. Last request for: ' + request.url + ' by ip: ' + ip);
	});
			


	response.writeHead(200, {'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked', 'Connection': 'keep-alive'});
			
/*
	var ping = setInterval(function () {
		//for ( var c in clients ) {
		console.log('send to client: ' + request.url + ' by ip: ' + ip);
		obj.ran = Math.random();
		response.write(JSON.stringify(obj)+'\n');
		//}
	}, 1000);	
	
*/

	// test message as event, override init for testing:
	//var messages = this.init('', '');
	var messages = Messages.init('', '');
	messages.on('message', function(message, reply) {
		//console.log('message> ' + util.inspect(message, true, 99, true));
		response.write(JSON.stringify(message)+'\n');
	});	
	
	
				

} // end onReceive.
server = http.createServer(onRequest).listen(5001);			// Start a HTTP Server.
console.log("streamapi> Kurunt Stream API Server has opened on port 5001.");




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

