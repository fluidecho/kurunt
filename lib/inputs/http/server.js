//
// HTTP Server
//
// HTTP server.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config			= require("./config.json");								// your config settings.
var gconfig			= require("../../.././config.json");			// your global config settings.
var http 				= require('http');												// Load the http Library.
var util 				= require('util');
var url 				= require("url");
var path 				= require("path");
var querystring = require('querystring');


var log 				= function(txt) { if ( config['debug'] === 'benchmarking' || config['debug'] === 'debug' ) { console.log(txt); } };


var server			= undefined;




var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	console.log('http@inputs> To use toobusy, you need to install >npm install toobusy -g');
}



// Start the HTTP Server.
module.exports.start = function (processID, route, messenger, streams) {
	function onRequest(req, res) {

		if (req.url === '/favicon.ico') {
			res.writeHead(200, {'Content-Type': 'image/x-icon'} );
			res.end();
			return;
		}
                

		var uri = url.parse(req.url).pathname;
		console.log(processID+'@inputs> uri: ' + uri);
   
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;   
   
console.log(processID+'@inputs> url_parts ' + util.inspect(url_parts, true, 99, true));
console.log(processID+'@inputs> query ' + util.inspect(query, true, 99, true)); 
   
   
		var ip = _ipAddress(req);
		console.log(processID+'@inputs> IP: ' + ip);


		// Handle incoming messages from clients.
		var data = '';
		var message = '';
		req.on('data', function (chunk) {
			data += chunk;                
		});


		req.on('end', function () {
		
			var apikey = 'nada';
		
			console.log(processID+'@inputs> Got data : ' + data.toString());
		
			//console.log(processID+'@inputs> Got message from for apikey: ' + apikey + ' from, ' + rinfo.address + ":" + rinfo.port + ', message: ' + message.toString());
/*
			if ( toobusy != undefined ) {		
				if (toobusy()) {
					//console.log('udp@inputs> Im toobusy.');
					// udp does not expose socket like tcp!
					socket.pause();
					setTimeout(function() {
						socket.resume();
						//console.log('udp@inputs> Im not too busy, resume.');
					}, TOOBUSY_PAUSE);
				}
			}
*/
			//route(apikey, config['name'], rinfo.address, message, messenger, streams, function (res) {
			//	if ( res === false ) {
			//		log(processID+'@inputs> No client host access found for ' + clients[client]['address'] + ' on apikey: ' + apikey + ' will ignore client.');
			//	}
			//});

		});
		
		
		
             res.writeHead(200, {
                        'Content-Length': '43', 
                        'Content-Type': 'image/gif',
                        'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
                        'Cache-Control': 'no-store, no-cache, must-revalidate',
                        'Pragma': 'no-cache',
                        'Connection': 'close'
                });
                res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');
                		


	} // end onReceive.
	server = http.createServer(onRequest).listen(config['input_port']);
	log(processID+'@inputs> HTTP (input) Server opened @ http://' + gconfig['host'] + ":" + config['input_port']);
}



function _ipAddress(request) {
        // try request.connection.socket.remoteAddresponses for https, request.socket.remoteAddresponses works for most http but request.connection.remoteAddress seems more reliable.
        var ip = undefined;
        try {
                ip = request.headers['x-forwarded-for'];
                if ( ip === undefined ) {
                        ip = __remoteAddress(request);
                }
        } catch ( err ) {
                ip = __remoteAddress(request);        
        }
        return ip;
}
function __remoteAddress(request) {
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

