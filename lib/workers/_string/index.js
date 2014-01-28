//
// Kurunt String Worker
//
// Simple string 'worker' for Kurunt, processing text data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: string
  // Sample: "hello world"
  //
  // See: http://docs.kurunt.com/String_Worker

  fn.logging.log('string@workers> MESSAGE: ', message);

  // use try catch so can skip over invalid messages.
  try {
  
    // (1) convert the incoming message.message from buffer to string (text).
    var string = message.message.toString(wk['config']['encoding']);    // "hello world" or whatever sent.
    
    fn.logging.log('string@workers> MESSAGE: ', string);
    
    // (2) add string value to this attribute, which get's added to this messages: stores: schema.
    var attributes = [];
    attributes['text'] = string;    // "hello world" or whatever sent.

    // (3) return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    fn.logging.log('string@workers> ERROR: ', e);
    return callback( false );
  }

};


var config = {
	"name": "string",
	"title": "String",	
	"description": "String, for processing text data.",
	"icon": "",
	"url": "http://docs.kurunt.com/String_Worker",
	"version": 0.2,	
	"date_mod": "10/22/2013",
	"inputs": [ "tcp", "udp", "http" ],
	"reports": [ "stream" ],
	"encoding": "utf8",
	"stores": [
		{
			"stream": {
				"schema": {
					"text": { }
				}
			}
		},
		{
			"mongo": {
				"schema": {
					"text": { }
				}
			}
		},
		{
			"redis": {
				"schema": {
					"text": { }		
				}
			}
		},
		{
			"mysql": {
				"schema": {
					"text": { "type": "varchar(512)" }
				}
			}
		}			
	]
};
exports.config = config;		// must export the config so kurunt can read it.
