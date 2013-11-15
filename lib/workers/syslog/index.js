//
// Kurunt Syslog Worker
//
// Syslog 'worker' for Kurunt, processing rsyslog data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var lconfig = require("./config.json");		// local config.


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: <pre>timestamp userid tag[pid]: message
  // Sample (rsyslog): <13>Nov 11 14:57:16 marcoxps test[10108]: mary had a little lamb
  // To test syslog: logger -i -t test "mary had a little lamb"
  //
  // See: http://docs.kurunt.com/workers/syslog/
  // See rsyslog: http://www.rsyslog.com/doc/syslog_parsing.html
  
  
  //console.log('syslog@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
    // convert the incoming message.message from buffer to string.
    var syslog = message.message.toString(wk['config']['encoding']);
		//console.log('syslog@workers> syslog: ' + require('util').inspect(syslog, true, 99, true));

		try {
		
			var regex = /^\<(.*?)\>(\S+) (\S+) (\S+) (\S+) (\S+) (.*?)$/;
		  var values = syslog.match(regex);  
		      
		  //console.log('syslog@workers> values: ' + require('util').inspect(values, true, 99, true));    // uncomment to debug message.

			var timestamp = values[2] + ' ' + values[3] + ' ' + new Date().getFullYear() + ' ' + values[4] + ' UTC';		// form date time for parsing.

		  var dt = Date.parse(timestamp);
		  unixtime = parseInt(dt / 1000);	
		  
		  var tag = values[6];
			var pid = 0;
			if ( tag.indexOf('[') != -1 ) {
				pid = Number(tag.substring(tag.indexOf('[') + 1, tag.indexOf(']')));
				tag = tag.substring(0, tag.indexOf('['));
			}
			if ( tag.substring(tag.length -1) === ':' ) {
				tag = tag.substring(0, tag.length -1);
			}

			var attributes = [];

		  attributes['pre'] = values[1];		// could set as number if sure all are!
		  attributes['unixtime'] = unixtime;
		  attributes['userid'] = values[5];
		  attributes['tag'] = tag;
		  attributes['pid'] = pid;

			if ( lconfig["trim_message"] ) {
		  	attributes['message'] = values[7].trim();
		  } else {
		  	attributes['message'] = values[7];
		  }

		} catch(rxe) {
			// something irregular about the format for this syslog, so will set within attributes['message'].
			console.log('syslog@workers> iregular syslog format ------------------------ !!!!!!!!!!!!!!!!!!!!!!!');
			if ( lconfig["trim_message"] ) {
		  	attributes['message'] = syslog.trim();
		  } else {
		  	attributes['message'] = syslog;
		  }
		}

    // return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('syslog@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

