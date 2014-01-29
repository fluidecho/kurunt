//
// Kurunt Client Send
//
// Client for sending message data into a Kurunt stream.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



//var util 					= require("util");
var net 					= require("net");			// tcp.
var dgram 				= require('dgram');		// udp.
var http 					= require('http');		// http.
var config    		= require(".././config.json");
var httpconfig 		= require('./inputs/http/config.json');		// need for getting http input port.

   
// send message to kurunt.
module.exports._send = function(stream, message, callback) {

	var HOST = config['host'];
	var PORT = stream.apikey;

	if ( stream.input.object === 'tcp' ) {
	
		var client = new net.Socket();
		client.connect(PORT, HOST, function() {
			//console.log('CONNECTED TO: ' + HOST + ':' + PORT);
			client.write(message + '\n');		// tcp must delineate message with LF.
			client.end();		// close connection.
			callback( null, true );
		});
		
	} else if ( stream.input.object === 'udp' ) {
		
		var message = new Buffer(message);
		var client = dgram.createSocket("udp4");
		client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
			client.close();
			callback( null, true );
		});	
	
	} else {
		// http request.

		var rpath = '';
		var rmethod = 'POST';

		var options = {
			host: HOST,
			path: '/' + stream.apikey + rpath,
			port: httpconfig['input_port'],
			method: rmethod,
			headers: {
				'user-agent': "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/513.12 (KHTML, like Gecko) Chrome/32.0.1640.33 Safari/517.1",
				'referer': "http://localhost/kurunt-admin/",
				'accept-language': "en-AU,en-US;q=0.8,en;q=0.6"
			}
		};

		var req = http.request(options, function(res) {
			//console.log('STATUS: ' + res.statusCode);
			//console.log('HEADERS: ' + JSON.stringify(res.headers));
			var str = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				//console.log('BODY: ' + chunk);
				str += chunk;
			});
			res.on('end', function () {
				callback( null, true );
			});
		});

		req.on('error', function(e) {
			//console.log('problem with request: ' + e.message);
			callback( new Error('error, request: ' + e.message), false );
		});

		// write data to request body
		req.write(message);
		req.end();

	}

};

