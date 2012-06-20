//
// Kurunt Common Schema
//
// Common Log Format schema.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var schema_config 			= require("./config.json");						// config settings for this schema.
var crypto 					= require('crypto');
var path					= require('path');
var g 						= require("../../functions.js");				// global functions and variables.


// this function always gets called when kurunt first starts up (must always have _load function).
function _load() {
	g.log('*Loading ' + schema_config['title'] + ' Schema.');
	
	// LogFormat "%h %l %u %t \"%r\" %>s %b" common
	// SAMPLE: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
	
	// See W3C:			http://www.w3.org/Daemon/User/Config/Logging.html#common-logfile-format
	// See Apache:		http://httpd.apache.org/docs/2.4/logs.html
	
}


// this function always gets called when etl.js processes the message (must always have process function).
function process(message) {
	//g.logDebug('*applying ' + schema_config['title'] + ' scheme');
	//g.logDebug('REGEX MES to pass: ' + message["message"]);
	//g.dump(message);
	
	message.schema =  {
		"name"				: schema_config['name'],
		"engine"			: schema_config['engine'],
		"attributes"		: []
	};	
	
	var values = [];														// used by regex.
	var attributes_values = [];												// used in message from values.
	
	// using regex convert message string into seperate values.
	var regex = /(\S+) (\S+) (\S+) \[(.*?)\] "(\S+.*?)" (\S+) (\S+)/;
	var values = message["message"].match(regex);  
	
	// verify values were extracted by regex from message.
	try {
		if ( values[1] == '' || values[3] == '' || values[5] == '' || values[6] == '' ) {
			g.logDebug('common: message not valid value.');
			return false;													// not found.
		}
	} catch(verr) {
		g.logDebug('common: message not valid value.');
		return false;														// not found.		
	}
	
	// regex example results.
	//values[0] = "973911bef1beb05bf55685fbe138741e";						// guid.
	//values[1] = "127.0.0.1";
	//values[2] = "-";
	//values[3] = "frank";	
	//values[4] = "10/Oct/2000:13:55:36 -0700";								// convert to unix time.
	//values[4] = 1325376555;	
	//values[5] = "GET /apache_pb.gif";
	//values[6] = 200;
	//values[7] = 2326;

	// 0																	// guid.
	attributes_values['host'] = values[1];									// host.
	attributes_values['userid'] = values[3];								// userid.
	// 3																	// time.
	attributes_values['request'] = values[5];								// request.
	attributes_values['status_code'] = parseInt(values[6]);					// status_code.
	attributes_values['size'] = parseInt(values[7]);						// size.

	// create a guid combining host (ip address) and user agent as hash to int.
	var guid = crypto.createHash('md5').update(attributes_values['host']+attributes_values['user_agent']).digest("hex");
	attributes_values['guid'] = guid;										// guid
	
	// time (as UTC unix timestamp)
	var message_time = values[4];
	if ( schema_config['discover_message_date'] === true && message_time != '' ) {
		// use time from message and ajust to UTC based on discovered timezone, EG: 10/Oct/2000:13:55:36 -0700
		var dt = Date.parse(message_time);
		//g.logDebug('dt	: ' + dt);
		// cleanup message_time so can be pased by js.
		if ( isNaN(dt) ) {
			var pos = message_time.indexOf(':');
			var year = parseInt(message_time.substring(pos - 4, pos));
			if ( year > 1969 ) {
				var message_time_fix = message_time.substring(0, pos) + ' ' + message_time.substring(pos + 1);
				dt = Date.parse(message_time_fix);							// 1325379076 (Sun, 01 Jan 2012 00:51:16 GMT)
				//g.logDebug('dt: ' + dt);
				if ( isNaN(dt) ) {
					g.logDebug('common: message not valid date value.');
					return false;											// not a valid date format!
				}
			} else {
				g.logDebug('common: message not valid date value.');
				return false;												// not a valid date format!
			}
		}
		var UTCUnix = parseInt(dt / 1000);									// unix timestamp.
		//g.logDebug('UTCUnix: ' + UTCUnix);
		attributes_values['time'] 	= UTCUnix;								// time (unix timestamp).
	} else {
		// use now time in UTC (if system was not set to UTC)
		var now 				= new Date(); 
		var nowUTC 				= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		var nowUTCUnix 			= parseInt(nowUTC / 1000);					// unix timestamp.
		//g.logDebug('nowUTCUnix: ' + nowUTCUnix);	
		attributes_values['time'] 	= nowUTCUnix;							// time (unix timestamp).
		// use now time (local system time).
		//var dt 				= new Date; 								// generic JS date object.
		//var unixtime_ms 		= dt.getTime(); 							// milliseconds since the epoch.
		//var unixtime 			= parseInt(unixtime_ms / 1000);				// unix timestamp.
		//attributes_values['time'] 	= unixtime;							// time (unix timestamp).
	}
	
	
	
	// for each attribute in config.json.
	for ( i in schema_config['sphinx_schema'] ) {
		//g.logDebug(schema_config['sphinx_schema'][i]['attr_type'] + ' = ' + schema_config['sphinx_schema'][i]['attr_name']);
		message.schema.attributes.push({
			"name"		: schema_config['sphinx_schema'][i]['attr_name'],
			"type"		: schema_config['sphinx_schema'][i]['attr_type'],
			"value" 	: attributes_values[schema_config['sphinx_schema'][i]['attr_name']],
			"id"		: -1
		});
	}

	return message;
	
}


// expose functions.
exports._load = _load;
exports.process = process;




// *******************************************************************
//	
// Sphinx RT indexes currently support the following attribute types:
// uint, bigint, float, timestamp, string
// 
// rt_attr_uint			= gid	
// rt_attr_bigint		= guid
// rt_attr_float		= gpa
// rt_attr_multi 		= my_tags
// rt_attr_multi_64 	= my_wide_tags
// rt_attr_timestamp	= ts_added
// rt_attr_string		= author
//
// NOTE: SphinxQL has a number of reserved words which CANNOT be used as schema attribute names (case insensitive)!
// Kurunt: also has a list of reserved words, including: KURUNT, REAL_VALUE, REPORT, FOO, ATTR_VALUES
// Also note cannot use - use _ instead!
// See for updated list: http://sphinxsearch.com/docs/current.html#sphinxql-reserved-keywords
// AND
// AS
// ASC
// AVG
// BEGIN
// BETWEEN
// BY
// CALL
// COLLATION
// COMMIT
// COUNT
// DELETE
// DESC
// DESCRIBE
// DISTINCT
// FALSE
// FROM
// GLOBAL
// GROUP
// ID
// IN
// INSERT
// INTO
// LIMIT
// MATCH
// MAX
// META
// MIN
// NOT
// NULL
// OPTION
// OR
// ORDER
// REPLACE
// ROLLBACK
// SELECT
// SET
// SHOW
// START
// STATUS
// SUM
// TABLES
// TRANSACTION
// TRUE
// UPDATE
// VALUES
// VARIABLES
// WARNINGS
// WEIGHT
// WHERE
// WITHIN
//
// *******************************************************************
