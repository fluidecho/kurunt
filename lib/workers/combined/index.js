//
// Kurunt Combined Worker
//
// Apache Combined 'worker' for Kurunt, processing access_log data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"" \"%{Cookie}i\""
  // Sample: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)" "USERID=Zepheira;IMPID=01234"
  //
  // See: http://docs.kurunt.com/Combined_Worker
  // See Apache: http://httpd.apache.org/docs/2.4/logs.html
  // See Ningx: http://wiki.nginx.org/HttpLogModule
  
  
  //console.log('combined@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
    // convert the incoming message.message from buffer to string.
    var access_log = message.message.toString(wk['config']['encoding']);

    // NOTE: could add geoip from maxmind for geo locating client_ip etc...

    // using regex convert message string into seperate values.
    var regex = /^(\S+) (\S+) (\S+) \[(.*?)\] "(\S+.*?)" (\S+) (\S+) "([^"]+)" "([^"]+)"( "([^"]+)"|)?$/;
    var values = access_log.match(regex);  
        
    //console.log('combined@workers> values: ' + require('util').inspect(values, true, 99, true));    // uncomment to debug message.

    // verify values were extracted by regex from message.
    try {
      if ( values[1] === '' || values[3] === '' || values[5] === '' || values[6] === '' || values[8] === '' || values[9] === '' ) {
        //console.log('combined: message not valid value.');
        return callback( false );
      }
    } catch(verr) {
      //console.log('combined: message not valid value.');
      return callback( false );               
    }
        
    // regex example results.
    //values[0] = "127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)" "USERID=Zepheira;IMPID=01234"";
    //values[1] = "127.0.0.1";
    //values[2] = "-";
    //values[3] = "frank";        
    //values[4] = "10/Oct/2000:13:55:36 -0700";      
    //values[5] = "GET /apache_pb.gif";
    //values[6] = 200;
    //values[7] = 2326;
    //values[8] = "http://www.example.com/start.html";
    //values[9] = "Mozilla/4.08 [en] (Win98; I ;Nav)";
    //values[10] = "USERID=Zepheira;IMPID=01234";

    // add values to this attribute (by unique name for all stores: schema), which get's added to this messages: stores: schema.
    var attributes = [];

    attributes['client_ip'] = values[1];
    attributes['identd'] = values[2];
    attributes['userid'] = values[3];

    var datetime = values[4];
        
    // use time from message and ajust to UTC based on discovered timezone, EG: 10/Oct/2000:13:55:36 -0700
    var dt = Date.parse(datetime);
    //console.log('dt: ' + dt);
    // cleanup message_time so can be pased by js.
    if ( isNaN(dt) ) {
      var pos = datetime.indexOf(':');
      var year = parseInt(datetime.substring(pos - 4, pos));
      if ( year > 1969 ) {
        var message_time_fix = datetime.substring(0, pos) + ' ' + datetime.substring(pos + 1);
        dt = Date.parse(message_time_fix);
        //console.log('dt: ' + dt);
        if ( isNaN(dt) ) {
          //console.log('combined: message not valid date value.');
          return callback( false );   // not a valid date format!
        }
      } else {
        //console.log('combined: message not valid date value.');
        return callback( false );   // not a valid date format!
      }
    }
    
    var unixtime_utc = parseInt(dt / 1000);
    //console.log('unixtime_utc: ' + unixtime_utc);
    
    attributes['unixtime_utc'] = unixtime_utc;                                                                                                                                        // time.
    attributes['request'] = values[5];
    attributes['status_code'] = parseInt(values[6]);
    attributes['size'] = parseInt(values[7]);
    attributes['referer'] = values[8];
    attributes['user_agent'] = values[9];
        
    // cleanup cookie (sould be able to do this in regex above but cant figure it out!?) - remove serounding quotes.
    var cookie = values[10];
    if ( cookie != undefined ) {
      cookie = cookie.substring(2, cookie.length - 1);
      attributes['cookie'] = cookie;
    } else {
      attributes['cookie'] = '';
    }

    // return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('combined@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};


var config = {
	"name": "combined",
	"title": "Combined",	
	"description": "Apache Combined Access Log, for processing access_log data.",
	"icon": "",
	"url": "http://docs.kurunt.com/Combined_Worker",
	"version": 0.2,	
	"date_mod": "10/22/2013",
	"inputs": [ "tcp", "udp" ],
	"reports": [ "stream" ],
	"encoding": "utf8",
	"stores": [
		{
			"stream": {
				"schema": {
					"client_ip": { },
					"identd": { },
					"userid": { },
					"unixtime_utc": { },
					"request": { },
					"status_code": { },
					"size": { },
					"referer": { },
					"user_agent": { },
					"cookie": { }
				}
			}
		},
		{
			"mongo": {
				"schema": {
					"client_ip": { },
					"identd": { },
					"userid": { },
					"unixtime_utc": { },
					"request": { },
					"status_code": { },
					"size": { },
					"referer": { },
					"user_agent": { },
					"cookie": { }
				}
			}
		},
		{
			"redis": {
				"schema": {
					"client_ip": { },
					"identd": { },
					"userid": { },
					"unixtime_utc": { },
					"request": { },
					"status_code": { },
					"size": { },
					"referer": { },
					"user_agent": { },
					"cookie": { }
				}
			}
		},		
		{
			"mysql": {
				"schema": {
					"client_ip": { "type": "varchar(128)" },
					"identd": { "type": "varchar(128)" },
					"userid": { "type": "varchar(128)" },
					"unixtime_utc": { "type": "int" },
					"request": { "type": "varchar(512)" },
					"status_code": { "type": "int" },
					"size": { "type": "bigint" },
					"referer": { "type": "varchar(512)" },
					"user_agent": { "type": "varchar(512)" },
					"cookie": { "type": "varchar(512)" }
				}
			}
		}
	]
};
exports.config = config;		// must export the config so kurunt can read it.
