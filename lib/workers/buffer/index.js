//
// Kurunt Buffer Worker
//
// Buffer worker, forwards unaltered messages as node.js buffer.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var gconfig	= require('../../.././config.json');
var log = function(txt, benchmarking, dump) { if ( dump != undefined && gconfig['loging'] === 'debug' ) { console.log(txt + ' >> ' + require('util').inspect(dump, true, 99, true)); } else if ( gconfig['loging'] === 'benchmarking' ) {	if ( benchmarking === true ) { console.log(txt); } } else if ( gconfig['loging'] === 'debug' ) { console.log(txt); } else if ( gconfig['loging'] === 'quiet' ) { } };


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: buffer (node.js)
  //
  // See: http://docs.kurunt.com/Buffer_Worker

  //console.log('buffer@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {

    var attributes = [];
    attributes['buffer'] = message.message;		// simply forwards message buffer.

    // return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('buffer@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};


var config = {
	"name": "buffer",
	"title": "Buffer",	
	"description": "Buffer, forwards unaltered messages as node.js buffer.",
	"icon": "",
	"url": "http://docs.kurunt.com/Buffer_Worker",
	"version": 0.2,	
	"date_mod": "10/22/2013",
	"inputs": [ "tcp", "udp", "http" ],
	"mq_nodelay": false,
	"reports": [ "stream" ],
	"message_codec": "json",
	"encoding": "utf8",
	"stores": [
		{
			"stream": {
				"schema": {
					"buffer": { }
				}
			}
		},
		{
			"mongo": {
				"schema": {
					"buffer": { }
				}
			}
		},
		{
			"redis": {
				"schema": {
					"buffer": { }
				}
			}
		},
		{
			"mysql": {
				"schema": {
					"buffer": { "type": "varchar(512)" }
				}
			}
		}
	]
};
exports.config = config;		// must export the config so kurunt can read it.
