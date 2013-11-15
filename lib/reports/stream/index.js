//
// Kurunt Sream Report
//
// Sream Report
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// for web server.
var url 				= require("url");
var path 				= require("path");
var fs 					= require("fs");
var mime 				= require("mime");
var util 				= require("util");
var clone 			= require('clone');
var lconfig 		= require("./config.json");


var app					= require('http').createServer(handler);


var io = undefined;		// can check if socket.io is installed.

try {
	io 				= require('socket.io').listen(app, { log: false });
} catch(e) {
	console.log('you need to install socket.io. >npm install socket.io');
}

var pname = 'stream@reports>';

module.exports._init = function (processID) {
	// only if socket.io is installed.
	if ( io != undefined ) {
		var portSt = "999" + processID.toString();

		var STREAM_REPORT_PORT = Number(portSt);
		console.log('stream#' + processID + '@reports> opening webserver on port: ' + STREAM_REPORT_PORT);
		pname = 'stream#' + processID + '@reports>';
		app.listen(STREAM_REPORT_PORT);
	} else {
		console.log('stream#' + processID + '@reports> not opening, socket.io not installed.');
	}
};



// web server handle browser requests, responses.
function handler(req, res) {

  var uri = url.parse(req.url).pathname;
  //var filename = path.join(process.cwd(), uri);
  var filename = '';
  
  if ( uri === '/' ) {
  	//filename = process.cwd() + '/lib/reports/stream/index.html';
  	filename = __dirname + '/index.html';
  } else {
  	//filename = process.cwd() + '/lib/reports/stream' + uri;
  	filename = __dirname + uri;
  }
  
  //console.log('stream@reports> uri: ' + uri);
  console.log(pname + ' filename: ' + filename);
  
	// favicon.
	if ( uri === '/favicon.ico' ) {
		res.writeHead(200, {'Content-Type': 'image/x-icon'} );
		res.end();
		return;
	}	  

	// --- static web server, return static requested file or 404 ------------------------------------
  fs.exists(filename, function(exists) {
    if(!exists) {
    	console.log(pname + ' 404 file');
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    }
 
	if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }
 
      res.writeHead(200, {"Content-Type": mime.lookup(filename)});
      res.write(file, "binary");
      res.end();
    });
  });
	// --- end static web server ---------------------------------------------------------------------
}



var QUE_MESSAGES_SLY_X = 10;		// how many (number) messages to queue. 
var QUE_MESSAGES_SLY = [];


var mps = 0;
var tot = 0;
var newMessage = false;


//var clientSockets = [];  
  

module.exports.message = function (message, callback) {

	//console.log('stream@reports, message> ' + util.inspect(message, true, 99, true));

	// truncating message slows performance.
	if ( lconfig['truncate_message'] === true ) {
		var msg = clone(message);
	
		// alternativly could use JSON to clone object, but Date wont parse etc. but is faster.
		//var msg = (JSON.parse(JSON.stringify(message)));
	
		// enqueue QUE_MESSAGES_SLY message, to maximum of QUE_MESSAGES_SLY_X.
		if ( QUE_MESSAGES_SLY.length >= QUE_MESSAGES_SLY_X ) {
			QUE_MESSAGES_SLY.splice(0, 1);		// remove first 'oldest' message item from array.
		}


		// go through each schema item and tuncate values to fit better in browser screen.
		for ( var s in message.stores ) {
			//console.log('s: ' + s + ' value: ' + message.stores[s]);
			for ( var st in message.stores[s] ) { 
				//console.log('st: ' + st + ' value: ' + message.stores[s][st]);
				if ( st === 'stream' ) {
					var dataObj = message.stores[s]['stream'];

					//console.log('stream> dataObj: ' + require('util').inspect(dataObj, true, 99, true));
				
					// schema items are a collection of objects, key = name of object.
					var schemaItems = Object.keys(dataObj['schema']);
	
					//console.log('stream@reports> schemaItems: ' + require('util').inspect(schemaItems, true, 99, true));
				
					schemaItems.forEach(function(item) {
						hasdata = true;
						//console.log('stream> attr: ' + require('util').inspect(dataObj['schema'][item], true, 99, true));
						
						//dataObj['schema'][item]['type']
	
						var value = dataObj['schema'][item]['value'];
					
						if ( value != undefined ) {
					
							value_json = JSON.stringify(value);
					
							if ( Buffer.byteLength(value_json, 'utf8') > 256 ) {
								// have to detect what type the value is: string, int, array, object, etc.
						
								//console.log('value type: ' + util.isArray(value) );
						
								if ( util.isArray(value) ) {
									value = value.slice(0, 9);
									value.push('...');
							
									// double check is still not too big
									value_json = JSON.stringify(value);
									if ( Buffer.byteLength(value_json, 'utf8') > 256 ) {
										value = [];
										value.push('...');
									}
								}
						
								// if Object ...
								if ( typeof value === 'object' ) {
									value = {};
									value['...'] = '...';
								}
						
								// if string ...
								if ( typeof value === 'string' ) {
									value = value.substring(0, 255) + '...';
								}
						
								// if integer ...
								if ( typeof value === 'number' ) {
									value = 0;
								}
						
							}

							msg.stores[s][st]['schema'][item].value = value;		// set the truncated value.
						}

					});		

				} else {
				
					// remove this store as not 'stream'.
					msg.stores[s][st] = '[truncated...]';
				
				
				
				}
			}
		}
		
		//console.log('stream@reports, msg> ' + util.inspect(msg, true, 99, true));	
		//console.log('stream@reports, message> ' + util.inspect(message, true, 99, true));	
		
		QUE_MESSAGES_SLY.push(msg);
	
	} else {

		// enqueue QUE_MESSAGES_SLY message, to maximum of QUE_MESSAGES_SLY_X.
		if ( QUE_MESSAGES_SLY.length >= QUE_MESSAGES_SLY_X ) {
			QUE_MESSAGES_SLY.splice(0, 1);		// remove first 'oldest' message item from array.
		}


		QUE_MESSAGES_SLY.push(message);
	}	
	
	newMessage = true;
		
	mps++;
	tot++;
	
	return callback( true );
	
};





var timmer2 = undefined;

// only if socket.io is installed.
if ( io != undefined ) {

	// web sockets and kurunt messages.
	io.sockets.on('connection', function (socket) {
		//console.log(pname + 'socket.io connection');

	/*
		clientSockets.push(socket);

		socket.on('disconnect', function(){
			//console.log('disconnect');
			var i = 0;
			for ( i = 0; i < clientSockets.length; i++ ) {
				if ( clientSockets[i] == socket ) {
					//console.log('delete this socket, i: ' + i);
					clientSockets.splice(i, i + 1);
				}
			}	
		});
	*/

		// emit every second, tested raw every on.message emit, but this overwhelms browser.
		if (timmer2 === undefined ) {
			timmer2 = setInterval(function () {		
			
				console.log('stream@reports> mps: ' + mps + ' n: ' + tot);

				socket.broadcast.emit('ticker', tot, mps);
				socket.broadcast.emit('messages', QUE_MESSAGES_SLY);


				mps = 0;		// reset
			}, 1000);  
		}


	// sending to all clients, include sender
	//io.sockets.emit('message', "this is a test");


	// sending to all clients in 'game' room(channel), include sender
	//io.sockets.in('game').emit('message', 'cool game');


	//if ( message.apikey.toString() === clients[client]['channel'] || message.tags.indexOf(clients[client]['channel']) != -1 ) {

		
	});

}


/*
// emit every second, tested raw every on.message emit, but this overwhelms browser.
var timmer = setInterval(function () {		
//console.log('*@workers> mps: ' + mps + ' n: ' + tot);

	var i = 0;
	for ( i = 0; i < clientSockets.length; i++ ) {
		//console.log('emit ticket on socket, i: ' + i);
		clientSockets[i].emit('ticker', tot, mps);
		//if ( newMessage === true ) {
			//newMessage = false;
			clientSockets[i].emit('messages', QUE_MESSAGES_SLY);
		//}
	}

	mps = 0;		// reset
}, 1000);  

  */
