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


var logging 		= require('../.././logging');


var uidNumberBands 	= require('uid-number-bands');
uidNumberBands.init(gconfig['band'], gconfig['bands'], true);		// [band, bands, start id at 1 = true else 0 = false].


var server			= undefined;


var toobusy = undefined;
try {
	toobusy = require('toobusy');
	var TOOBUSY_PAUSE = 200;		// set in miliseconds to pause incomming stream.
} catch(e) {
	logging.log('http@inputs> To use toobusy, you need to install >npm install toobusy -g');
}



var streams = {};		// get dynamically set/unset by index.js through web admin.
exports.streams = streams;



// Start the HTTP Server.
module.exports.start = function (processID, route, messenger) {
	function onRequest(req, res) {

		// some http clients request favicon, return.
		if (req.url === '/favicon.ico') {
			res.writeHead(200, {'Content-Type': 'image/x-icon'});
			res.end();
			return;
		}

		var uri = url.parse(req.url).pathname;
		//console.log(processID+'@inputs> uri: ' + uri);
   
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
		
		// apikey.
		var apikey = url_parts.pathname.substring(1, 17);
		//console.log('apikey: ' + apikey);
		
		// lookup apikey with open streams.
		//console.log(processID+'@inputs> streams ' + util.inspect(streams, true, 99, true));
		if ( streams[apikey] === undefined ) {
			if ( url_parts.pathname.indexOf('.gif') != -1 && req.method === 'GET' ) {
				// return 1 pixel transparent gif.
				res.writeHead(200, {
					'Server': 'Kurunt',
					'Content-Length': '43',
					'Content-Type': 'image/gif',
					'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
					'Cache-Control': 'no-store, no-cache, must-revalidate',
					'Pragma': 'no-cache',
					'X-Kurunt': 'unauthorized request',
					'Connection': 'close'
				});
				res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');		
				return;
			} else {
				res.writeHead(403, {'Server': 'Kurunt', 'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
				res.write( JSON.stringify({"status": "unauthorized request"}) + '\n' );   // return the message id.
				res.end();
				return;
			}
		}
		if ( streams[apikey]['status'] != 'open' ) {
			if ( url_parts.pathname.indexOf('.gif') != -1 && req.method === 'GET' ) {
				// return 1 pixel transparent gif.
				res.writeHead(200, {
					'Server': 'Kurunt',
					'Content-Length': '43',
					'Content-Type': 'image/gif',
					'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
					'Cache-Control': 'no-store, no-cache, must-revalidate',
					'Pragma': 'no-cache',
					'X-Kurunt': 'unauthorized request',
					'Connection': 'close'
				});
				res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');		
				return;
			} else {		
				res.writeHead(403, {'Server': 'Kurunt', 'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
				res.write( JSON.stringify({"status": "unauthorized request"}) + '\n' );   // return the message id.
				res.end();
				return;
			}
		}		
		
		
		if ( req.method === 'GET' || req.method === 'PUT' || req.method === 'POST' ) {
			// GET, PUT, POST http verbs are accepted, okay.
		} else {
			if ( url_parts.pathname.indexOf('.gif') != -1 && req.method === 'GET' ) {
				// return 1 pixel transparent gif.
				res.writeHead(200, {
					'Server': 'Kurunt',
					'Content-Length': '43',
					'Content-Type': 'image/gif',
					'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
					'Cache-Control': 'no-store, no-cache, must-revalidate',
					'Pragma': 'no-cache',
					'X-Kurunt': 'invalid method request',
					'Connection': 'close'
				});
				res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');		
				return;
			} else {		
				res.writeHead(403, {'Server': 'Kurunt', 'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
				res.write( JSON.stringify({"status": "invalid method request"}) + '\n' );   // return the message id.
				res.end();
				return;
			}
		}
		
   
//console.log(processID+'@inputs> url_parts ' + util.inspect(url_parts, true, 99, true));
//console.log(processID+'@inputs> query ' + util.inspect(query, true, 99, true)); 
   
   
		var client_ip = _ipAddress(req);
		//console.log(processID+'@inputs> IP: ' + ip + ' port: ' + req.connection.remotePort);
		if ( client_ip === false || req.headers.host == undefined ) {
			res.writeHead(403, {'Server': 'Kurunt', 'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
			res.write( JSON.stringify({"status": "invalid request"}) + '\n' );   // return the message id.
			res.end();
			return;		
		}


		var mime_type = req.headers['content-type'];
		//console.log('mime_type: ' + mime_type);
		
		// Handle incoming messages from client.
		
		var buffer = new Buffer(0);		// concat until message completed.
		
		// on chunk concate buffer.
		req.on('data', function (chunk) {
			buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
             
		});
		
		// on end of data, use concated buffer as message.
		req.on('end', function () {
			
			if ( req.method === 'GET' ) {
				// form the message from the query and headers.
				var mObj = {};
				mObj.query = query;
				mObj.client_ip = client_ip;
				mObj.client_port = req.connection.remotePort;
				mObj.pathname = url_parts.pathname;
				mObj.language = req.headers['accept-language'];
				mObj.user_agent = req.headers['user-agent'];
				mObj.referer = req.headers.referer;
				mObj.cookie = req.headers.cookie;  
				//console.log(processID+'@inputs> GET req.headers ' + util.inspect(req.headers, true, 99, true)); 
				var message = new Buffer(JSON.stringify(mObj));
			} else {
				var message = buffer;
				//console.log(processID+'@inputs> Got end(), buffer : ' + buffer.toString());
			}

			buffer = null;		// reset buffer.
			
			var id = uidNumberBands.make();		// id is object, eg: id.uid etc.

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
			route(apikey, config['name'], __remoteAddress(req), message, id, mime_type, messenger, streams, function (validHost) {
			
				if ( url_parts.pathname.indexOf('.gif') != -1 && req.method === 'GET' ) {
					// return 1 pixel transparent gif.
					var x_kurunt = id.uid;
					if ( validHost === false ) {
						x_kurunt = 'unauthorized request';
					}
					res.writeHead(200, {
						'Server': 'Kurunt',
						'Content-Length': '43',
						'Content-Type': 'image/gif',
						'Expiresponse': 'Mon, 26 Jul 2005 05:00:00 GMT',
						'Cache-Control': 'no-store, no-cache, must-revalidate',
						'Pragma': 'no-cache',
						'X-Kurunt': x_kurunt,
						'Connection': 'close'
					});
				  res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');		
				} else {
					if ( validHost === true ) {
						// return json message with id for this message.
						res.writeHead(200, {'Server': 'Kurunt', 'X-Kurunt': id.uid, 'Content-Type': 'application/json; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Connection': 'keep-alive'});
						res.write( JSON.stringify({"uid": id.uid}) + '\n' );   // return the message id.
						res.end();
					} else {
						logging.log(processID+'@inputs> No client host access found for ' + __remoteAddress(req) + ' on apikey: ' + apikey + ' will ignore client.');
						res.writeHead(403, {'Server': 'Kurunt', 'Content-Type': 'application/json; charset=utf-8', 'Connection': 'closed'});
						res.write( JSON.stringify({"status": "unauthorized request"}) + '\n' );   // return the message id.
						res.end();
						return;
					}
				}	
				
			});

		});
	
		// NOTE: req.connection.addListener, can cause errors when emitter.setMaxListeners() exceeded.

	} // end onReceive.
	server = http.createServer(onRequest).listen(config['input_port']);
	logging.log(processID+'@inputs> HTTP (input) Server opened @ http://' + gconfig['host'] + ":" + config['input_port']);
	//console.log(processID+'@inputs> streams ' + util.inspect(streams, true, 99, true));
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

