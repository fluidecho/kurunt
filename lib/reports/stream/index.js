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


	console.log('HELLO FROM STREAM REPORT!!!!!!!!!!!');
	var app					= require('http').createServer(handler);


try {
	var io 				= require('socket.io').listen(app, { log: false });
} catch(e) {
	console.log('you need to install socket.io. >npm install socket.io');
}


module.exports._init = function (processID) {

	var portSt = "999" + processID.toString();

	var STREAM_REPORT_PORT = Number(portSt);
	console.log('stream#' + processID + '@reports> opening webserver on port: ' + STREAM_REPORT_PORT);
	app.listen(STREAM_REPORT_PORT);
};




/*
// kurunt messages.
var Messages 		= require('../../../lib/stores/stream/./index.js');
//var messages 		= Messages._messages();
var msg = new Messages.Downloader();

msg.on('message', function(message) {
	console.log('message> ' + util.inspect(message, true, 99, true));
});
*/


// web server handle browser requests, responses.
function handler(req, res) {

  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), uri);
  
  if ( uri === '/' ) {
  	filename = filename + 'lib/reports/stream';
  } else {
  	filename = process.cwd() + '/lib/reports/stream' + uri;
  }
  
  console.log('uri: ' + uri);
  console.log('filename: ' + filename);
  
	// favicon.
	if ( uri === '/favicon.ico' ) {
		res.writeHead(200, {'Content-Type': 'image/x-icon'} );
		res.end();
		return;
	}	  

	// --- static web server, return static requested file or 404 ------------------------------------
  fs.exists(filename, function(exists) {
    if(!exists) {
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

  
  
var clientSockets = [];  
  
 /*
messages.on('message', function(message, reply) {
		//console.log('message> ' + util.inspect(message, true, 99, true));
		//console.log(JSON.stringify(message)+'\n');
		
		
		// enqueue QUE_MESSAGES_SLY message, to maximum of QUE_MESSAGES_SLY_X.

	if ( QUE_MESSAGES_SLY.length >= QUE_MESSAGES_SLY_X ) {
		QUE_MESSAGES_SLY.splice(0, 1);		// remove first 'oldest' message item from array.
	}
		
		
		

		

	// truncate 'stream' message schema values (like long images).
	for ( var s in message.stores ) {
		//console.log('s: ' + s + ' value: ' + message.stores[s]);
		for ( var v in message.stores[s] ) {
			//console.log('v: ' + v + ' value: ' + message.stores[s][v]);
			
			if ( v === 'stream' ) {
				for ( var d in message.stores[s]['stream']['schema'] ) {

					var value = message.stores[s]['stream']['schema'][d]['value'];
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
							
							message.stores[s]['stream']['schema'][d]['value'] = value;
						}
						
						// if Object ...
						if ( typeof value === 'object' ) {
							value = {};
							value['...'] = "...";
						}
						
						// if string ...
						if ( typeof value === 'string' ) {
							value = value.substring(0, 255);
						}
						
						// if integer ...
						if ( typeof value === 'number' ) {
							value = 0;
						}
						
					}
					
					
					
				}
			}
			
		}
	}
	

	
	
	
	
	
	
	//var mtrimed = ,"stores":[{"stream":{"schema":[{"name":"image","value"
	
	//,"stores":[{"stream":{"schema":[{"name":"image","value"	
		
	QUE_MESSAGES_SLY.push(message);
	newMessage = true;
		
	mps++;
	tot++;
});	

*/





module.exports.message = function (message) {
		//console.log('message> ' + util.inspect(message, true, 99, true));
		//console.log(JSON.stringify(message)+'\n');
		
		
		// enqueue QUE_MESSAGES_SLY message, to maximum of QUE_MESSAGES_SLY_X.

	if ( QUE_MESSAGES_SLY.length >= QUE_MESSAGES_SLY_X ) {
		QUE_MESSAGES_SLY.splice(0, 1);		// remove first 'oldest' message item from array.
	}
		
	

	// truncate 'stream' message schema values (like long images).
	for ( var s in message.stores ) {
		//console.log('s: ' + s + ' value: ' + message.stores[s]);
		for ( var v in message.stores[s] ) {
			//console.log('v: ' + v + ' value: ' + message.stores[s][v]);
			
			if ( v === 'stream' ) {
				for ( var d in message.stores[s]['stream']['schema'] ) {

					var value = message.stores[s]['stream']['schema'][d]['value'];
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
							
							message.stores[s]['stream']['schema'][d]['value'] = value;
						}
						
						// if Object ...
						if ( typeof value === 'object' ) {
							value = {};
							value['...'] = "...";
						}
						
						// if string ...
						if ( typeof value === 'string' ) {
							value = value.substring(0, 255);
						}
						
						// if integer ...
						if ( typeof value === 'number' ) {
							value = 0;
						}
						
					}
					
					
					
				}
			}
			
		}
	}
	
		
	QUE_MESSAGES_SLY.push(message);
	newMessage = true;
		
	mps++;
	tot++;
};














// web sockets and kurunt messages.
io.sockets.on('connection', function (socket) {
	//console.log('connection');

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






	// NOTE: cant emit every message to browser, so will have to queue the last X number of messages,
	// then emit to browser when sly is scrolled.

  socket.on('getMessages', function () {
  /*
		var timmer2 = setInterval(function () {		

				//console.log('getMessages, QUE_MESSAGES_SLY.length: ' + QUE_MESSAGES_SLY.length);
				//console.log('emit messages, QUE_MESSAGES_SLY.length: ' + QUE_MESSAGES_SLY.length);
				
				if ( newMessage === true ) {
					newMessage = false;
					
					//var msgs = [];
					//msgs = QUE_MESSAGES_SLY.slice(QUE_MESSAGES_SLY.length - QUE_MESSAGES_SLY_X, QUE_MESSAGES_SLY_X);
					
					
					socket.emit('messages', QUE_MESSAGES_SLY);
				}

		}, 1000);  // 1x per second.
   */
		//if ( q !== QUE_MESSAGES_SLY.length ) {

			//q = QUE_MESSAGES_SLY.length;
		//}    
    
  });
  
});

// emit every second, tested raw every on.message emit, but this overwhelms browser.
var timmer = setInterval(function () {		
//console.log('*@workers> mps: ' + mps + ' n: ' + tot);
//socket.emit('ticker', tot, mps);
		
		
	//emitTicker(socket);
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
	
	



  
