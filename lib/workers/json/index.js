//
// Kurunt JSON Worker
//
// JSON 'worker' for Kurunt, processing json formated data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: json
  // Sample: {"hello": "world"}
  //
  // See: http://docs.kurunt.com/JSON_Worker

  fn.logging.log('json@workers> MESSAGE: ', message);

  // use try catch so can skip over invalid messages.
  try {

    var json = JSON.parse(message.message.toString(wk['config']['encoding']));

		fn.logging.log('json@workers> json: ', json);
    
    var attributes = [];
    attributes['json'] = json;

    return callback( [ message, attributes ] );
  
  } catch(e) {
    fn.logging.log('json@workers> ERROR: ', e);
    return callback( false );
  }

};


var config = {
	"name": "json",
	"title": "JSON",
	"description": "JavaScript Object Notation, for processing JSON data.",
	"icon": "",
	"url": "http://docs.kurunt.com/JSON_Worker",
	"version": 0.2,
	"date_mod": "10/22/2013",
	"inputs": [ "tcp", "udp", "http" ],
	"reports": [ "stream" ],
	"encoding": "utf8",
	"stores": [
		{
			"stream": {
				"schema": {
					"json": { }
				}
			}
		},
		{
			"mongo": {
				"schema": {
					"json": { }		
				}
			}
		},
		{
			"redis": {
				"schema": {
					"json": { }		
				}
			}
		},
		{
			"mysql": {
				"schema": {
					"json": { "type": "varchar(512)" }		
				}
			}
		}		
	]
};
exports.config = config;		// must export the config so kurunt can read it.
