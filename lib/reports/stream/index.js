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

var lconfig 		= require("./config.json");
var gconfig 		= require("../../.././config.json");

var app					= require('http').createServer(handler);

var io 					= undefined;		// can check if socket.io is installed.
try {
	io 						= require('socket.io').listen(app, { log: false });
} catch(e) {
	console.log('you need to install socket.io. >npm install socket.io -g');
}

var pname 			= 'stream@reports>';


module.exports._init = function (processID) {
	// only if socket.io is installed.
	if ( io != undefined ) {
	
		//var portSt = lconfig['port'].toString().substring(0, lconfig['port'].toString().length - 1) + processID.toString();
		var portSt = lconfig['port'] + Number(processID);

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
  
  console.log('stream@reports> uri: ' + uri);
  //console.log(pname + ' filename: ' + filename);

  // info requests.
  if ( uri === '/X-kurunt.info' ) {
    res.writeHead(200, 
    	{
      	"Content-Type": "application/plain",
      	"X-kurunt-admin-address": "http://"+gconfig['host']+":"+gconfig['admin_www_port']
    	}
    );
    res.end();
    return; 
  }

	// favicon.
	if ( uri === '/favicon.ico' ) {
		res.writeHead(200, {'Content-Type': 'image/x-icon'} );
		res.end();
		return;
	}	  

	// --- static web server, return static requested file or 404 ------------------------------------
  fs.exists(filename, function(exists) {
    if(!exists) {
    	//console.log(pname + ' 404 file');
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
 
      res.writeHead(200, 
      	{
      		"Content-Type": mime.lookup(filename)
      	}
      );
      res.write(file, "binary");
      res.end();
    });
  });
	// --- end static web server ---------------------------------------------------------------------
}



// NOTE: If using multiple workers within topology.json, then will recieve messages sequentially from each worker but not between workers.
// For example: may recieve the last message from worker 1 which has a lesser id then worker 0's last message, worker 1 finished slower than worker 0.

var MESSAGES_QUE_X = 20;		// how many (number) messages to queue, dont set too high as will overwhelm browser. 
var messages_que = [];			// array of the last messages recieved to send to browsers, then used in sly.
messages_que['all'] = [];


var mps = [];			// array for each stream.
mps['all'] = 0;		// set 'all' room/channel.
var tot = [];			// array for each stream.
tot['all'] = 0;		// set 'all' room/channel.

module.exports.message = function (message, callback) {
	//console.log('stream@reports, message> ' + util.inspect(message, true, 99, true));

	var room_name = message.worker.object.toString() + '_' + message.apikey.toString();		// need to match browser selected streams (room).

	// truncating message slows performance.
	if ( lconfig['truncate_message'] === true ) {
		
		// alternativly could use clone [var clone = require('clone')] as JSON wont pass Date etc. but JSON is faster.
		var msg = (JSON.parse(JSON.stringify(message)));
		//var msg = clone(message);
	
		// enqueue messages_que message, to maximum of MESSAGES_QUE_X.
		if ( messages_que.length >= MESSAGES_QUE_X ) {
			messages_que.splice(0, 1);		// remove first 'oldest' message item from array.
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
		
		// enqueue messages_que message, to maximum of MESSAGES_QUE_X.
		if ( typeof messages_que[room_name] === 'undefined' ) {
			messages_que[room_name] = [];		// set fresh array for this room.
		}
		if ( messages_que[room_name].length >= MESSAGES_QUE_X ) {
			messages_que[room_name].splice(0, 1);		// remove first 'oldest' message item from array.
		}
		messages_que[room_name].push(msg);
		
		// set for 'all' room/stream.
		if ( messages_que['all'].length >= MESSAGES_QUE_X ) {
			messages_que['all'].splice(0, 1);		// remove first 'oldest' message item from array.
		}
		messages_que['all'].push(msg);
	
	} else {

		// enqueue messages_que message, to maximum of MESSAGES_QUE_X.
		if ( typeof messages_que[room_name] === 'undefined' ) {
			messages_que[room_name] = [];		// set fresh array for this room.
		}
		if ( messages_que[room_name].length >= MESSAGES_QUE_X ) {
			messages_que[room_name].splice(0, 1);		// remove first 'oldest' message item from array.
		}
		messages_que[room_name].push(message);
		
		// set for 'all' room/stream.
		if ( messages_que['all'].length >= MESSAGES_QUE_X ) {
			messages_que['all'].splice(0, 1);		// remove first 'oldest' message item from array.
		}
		messages_que['all'].push(message);
		
	}	
	
	mps['all']++;
	tot['all']++;
	
	if ( typeof tot[room_name] === 'undefined' ) {
		tot[room_name] = 0;		// create new array item and set to start at 0.
	}
	tot[room_name]++;

	if ( typeof mps[room_name] === 'undefined' ) {
		mps[room_name] = 0;		// create new array item and set to start at 0.
	}
	mps[room_name]++;	
	
	return callback( true );
	
};




var timmer = undefined;

// only if socket.io is installed.
if ( io != undefined ) {

	// web sockets and kurunt messages.
	io.sockets.on('connection', function (socket) {

		// reset all mps rooms, even non active.
		for ( var h in mps ) {
			mps[h] = 0;	//reset.
		}

		socket.on('getStreams', function (x) {
    	//console.log('getStreams req: ' + x);
	 		// cant just require(stream) because it's cached not refreshed, so readFile.
			fs.readFile(__dirname + '/../../../streams.json', function (err, d) {
				if (err) throw err;
				var streams = JSON.parse(d.toString());
				//console.log('streams> ' + util.inspect(streams, true, 99, true));
				socket.emit('streams', streams);
			});   	
  	});

		socket.on('getStream', function (stream) {
			if ( stream === undefined ) {
				stream = 'all';
			}
    	//console.log('getStream req: ' + stream);
  		socket.set('stream', stream, function() { 
  			//console.log('stream ' + stream + ' saved'); 
  		} );
      socket.join(stream);
      

			// emit every second, tested raw every on.message emit, but this overwhelms browser.
			if (timmer === undefined ) {
				timmer = setInterval(function () {
			
					console.log('stream@reports> (all) mps: ' + mps['all'] + ' n: ' + tot['all']);

					// broadcast by each room (stream) connected.
					for ( var r in io.sockets.manager.rooms ) {
						
						if ( r != '' ) {
							var room = r.substring(1);
							//console.log('room name: ' + room);
							io.sockets.in(room).emit('ticker', tot[room], mps[room]);
							io.sockets.in(room).emit('messages', messages_que[room]);		
						}

					}

					
					// reset all mps rooms, even non active.
					for ( var h in mps ) {
						mps[h] = 0;	//reset.
					}
					
				}, 1000);
			}      


  	});


	});

}

