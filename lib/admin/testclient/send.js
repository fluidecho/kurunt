//
// Kurunt Client Send
//
// Client for sending message data into a Kurunt stream.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



var util 					= require("util");
var net 					= require("net");			// tcp.
var dgram 				= require('dgram');		// udp.
var http 					= require('http');		// http.
var fs 						= require('fs');			// to read jpeg images.

var config 				= require('../../.././config.json');
try {
	var streams 			= require('../../.././streams.json');
} catch(e) {
	var streams = {"streams":[]};
}

var httpconfig 	= require('../.././inputs/http/config.json');		// need for getting http input port.
//var httpconfig = {};
//httpconfig['input_port'] = 5555;


var this_stream 	= undefined;
var apikey 				= undefined;


// a map of each message format to send to workers.
var message_map = {};

message_map.webpixel = '';		// note: '/?pic.gif?hello=world' within request path.
message_map.string = 'hello world';
message_map.json = '{"hello":"world"}';
message_map.csv = 'A,B,C';
message_map.syslog = '<13>Nov 11 14:57:16 marcopolo test[10108]: mary had a little lamb';
message_map.combined = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)" "USERID=Zepheira;IMPID=01234"';
message_map.buffer = '☃';

// read jpeg image files.
// have to use __dirname cause when called by other module throws relative path!
fs.readFile(__dirname + '/image.jpeg', function(err, data) {
  if (err) throw err; // Fail if the file can't be read.
  message_map.jpeg = new Buffer(data).toString('base64');
});

message_map.webpixel = '';

module.exports.init = function (xconfig, xstreams) {
	// set config.
	if ( xconfig != undefined ) {
		config = xconfig;
	}
	// set streams.
	if ( xstreams != undefined ) {
		streams = xstreams;
	}	
};



if( require.main === module ) {
	//called directly.
	process.argv.forEach(function (val, index, array) {
		//console.log('ARGS: ' + index + ': ' + val + ' arr: ' + array);
		if ( val.indexOf('-apikey=') != -1 ) {
			apikey = val.substring(val.indexOf('-apikey=') + 8);
		}
	});
	setTimeout(function () {
		send(apikey, function(msent) {
		});
	}, 1000);

} else {
	// called as module.
}


   
// send message to kurunt.
exports.send = send;
function send(apikey, callback) {

	if ( apikey.length != 16 ) {
		apikey = Number(apikey);		// is port number.
	}
	//console.log('apikey: ' + apikey);

	for ( var stream in streams['streams'] ) {
		//console.log('stream> apikey: ' + streams['streams'][stream]['apikey']);
		if ( apikey === streams['streams'][stream]['apikey'] ) {
			this_stream = streams['streams'][stream];
			//console.log('send@client, use this stream> ' + util.inspect(this_stream, true, 99, true));
		}
	}

	if ( this_stream['input']['object'] === 'http' ) {
		var stream_input_address = this_stream.input.object + '://' + config['host'] + ':' + httpconfig['input_port'] + '/' + this_stream.apikey;
	} else {
		var stream_input_address = this_stream.input.object + '://' + config['host'] + ':' + this_stream.apikey;
	}

	//console.log('send@client> stream_input_address: ' + stream_input_address);

	//console.log('message to send: ' + message_map[this_stream.worker]);

	var HOST = config['host'];
	var PORT = this_stream.apikey;

	if ( this_stream.input.object === 'tcp' ) {
	
		var client = new net.Socket();
		client.connect(PORT, HOST, function() {
			//console.log('CONNECTED TO: ' + HOST + ':' + PORT);
			client.write(message_map[this_stream.worker] + '\n');
			client.end();		// close connection.
			if ( this_stream.worker === 'buffer' ) {
				callback('&#9731');
			} else {
				callback(message_map[this_stream.worker]);
			}
		});
		
	} else if ( this_stream.input.object === 'udp' ) {
		
		var message = new Buffer(message_map[this_stream.worker]);
		var client = dgram.createSocket("udp4");
		client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
			client.close();
			if ( this_stream.worker === 'buffer' ) {
				callback('&#9731');
			} else {
				callback(message_map[this_stream.worker]);
			}
		});	
	
	} else {
		// http request.

		var rpath = '';
		var rmethod = 'POST';
		
		if ( this_stream.worker === 'webpixel' ) {
			rpath = '/?pic.gif?hello=*ping*';
			rmethod = 'GET';
		}

		var options = {
			host: HOST,
			path: '/' + this_stream.apikey + rpath,
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
				//console.log(str);
				if ( this_stream.worker === 'buffer' ) {
					callback('&#9731');
				} else {
					callback(message_map[this_stream.worker]);
				}
			});
		});

		req.on('error', function(e) {
			//console.log('problem with request: ' + e.message);
		});

		// write data to request body
		req.write(message_map[this_stream.worker]);
		req.end();

	}

};

