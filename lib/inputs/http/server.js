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


//var streams = {};		// get dynamically set/unset by index.js through web admin.
//exports.streams = streams;


var uidNumberBands 	= require('uid-number-bands');
uidNumberBands.init(gconfig['band'], gconfig['bands']);


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

		// some http clients request favicon, return.
		if (req.url === '/favicon.ico') {
			res.writeHead(200, {'Content-Type': 'image/x-icon'});
			res.end();
			return;
		}

		var uri = url.parse(req.url).pathname;
		console.log(processID+'@inputs> uri: ' + uri);
   
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
		
		// apikey.
		var apikey = url_parts.pathname.substring(1, 17);
		console.log('apikey: ' + apikey);
		
		// lookup apikey with open streams.
		//console.log(processID+'@inputs> streams ' + util.inspect(streams, true, 99, true));
		if ( streams[apikey] === undefined ) {
			res.writeHead(403, {'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
			res.write( JSON.stringify({"status": "invalid request"}) + '\n' );   // return the message id.
			res.end();
			return;
		}
   
console.log(processID+'@inputs> url_parts ' + util.inspect(url_parts, true, 99, true));
console.log(processID+'@inputs> query ' + util.inspect(query, true, 99, true)); 
   
   
		var ip = _ipAddress(req);
		console.log(processID+'@inputs> IP: ' + ip + ' port: ' + req.connection.remotePort);
		if ( ip === false ) {
			res.writeHead(403, {'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
			res.write( JSON.stringify({"status": "invalid request"}) + '\n' );   // return the message id.
			res.end();
			return;		
		}


		// Handle incoming messages from client.
		
		var buffer = new Buffer(0);		// concat until message completed.
		
		// on chunk concate buffer.
		req.on('data', function (chunk) {
			buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
             
		});
		
		// on end of data, use concated buffer as message.
		req.on('end', function () {
		
			console.log(processID+'@inputs> Got end(), buffer : ' + buffer.toString());
			var message = buffer;

			buffer = null;		// reset buffer.
			
			// set id for this message.
			var ida = uidNumberBands.make();
			var unixtime = ida.substring(0, 10);
			var idn = Number(ida.substring(10)) + 1;		// + 1 to start id range at ...000000001 rather than ...000000000
			var id = unixtime.toString() + uidNumberBands._padd_number(idn);
			
			if ( url_parts.pathname.indexOf('.gif') != -1 ) {
				// return 1 pixel transparent gif.
				res.writeHead(200, {
					'Content-Length': '43', 
					'Content-Type': 'image/gif',
					'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
					'Cache-Control': 'no-store, no-cache, must-revalidate',
					'Pragma': 'no-cache',
					'Connection': 'close'
				});
        res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');		
			} else {
				// return json message with id for this message.
				res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Connection': 'keep-alive'});
				res.write( JSON.stringify({"id": id}) + '\n' );   // return the message id.
				res.end();
			}

/*
			if ( toobusy != undefined ) {		
				if (toobusy()) {
					//console.log('udp@inputs> Im toobusy.');
					// TODO: udp does not expose socket like tcp! how to pause?
					socket.pause();
					setTimeout(function() {
						socket.resume();
						//console.log('udp@inputs> Im not too busy, resume.');
					}, TOOBUSY_PAUSE);
				}
			}
*/

			// route ...
			route(apikey, config['name'], ip, message, id, messenger, streams, function (res) {
				if ( res === false ) {
					log(processID+'@inputs> No client host access found for ' + ip + ' on apikey: ' + apikey + ' will ignore client.');
				}
			});

		});
	
		req.connection.addListener('close', function () {
		  console.log('http@inputs> Client closed. Last request for: ' + req.url + ' by ip: ' + ip);
		});

	} // end onReceive.
	server = http.createServer(onRequest).listen(config['input_port']);
	log(processID+'@inputs> HTTP (input) Server opened @ http://' + gconfig['host'] + ":" + config['input_port']);
	console.log(processID+'@inputs> streams ' + util.inspect(streams, true, 99, true));
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

