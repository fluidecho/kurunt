//
// Kurunt Combined Schema
//
// Apache Combined Log Format schema.
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
	
	// LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"" \"%{Cookie}i\"" combined
	// SAMPLE: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)" "USERID=Zepheira;IMPID=01234"
	// Note: Not collecting %l (identd) field as unlikly to exists. Also Cookie field is specified by NCSA but not by Apache, so treating as optional in regex.
	//
	// See Apache: 		http://httpd.apache.org/docs/2.4/logs.html
	// See Ningx: 		http://wiki.nginx.org/HttpLogModule
	
	// GeoIP: 			now load geoip dbs and library (if using).
	if ( schema_config['geoip_city'] === true ) {
		g.logDebug('loading geoip dbs and library.');
		// Maxmind GeoIP, using node client https://github.com/kuno/GeoIP
		var assert = require('assert'), geoip  = require('/usr/local/lib/node_modules/geoip');	// load library maybe located globally in: /usr/local/lib/node_modules/geoip
		var GeoIPCityIPv4 = geoip.City, GeoIPCityIPv6 = geoip.City6, GeoIPCountryIPv4 = geoip.Country, GeoIPCountryIPv6 = geoip.Country6;
		if (path.existsSync(schema_config['geoip_db_path'] + '/GeoLiteCity.dat')) {
			cityIPv4 		= new GeoIPCityIPv4(schema_config['geoip_db_path'] + '/GeoLiteCity.dat', true); 	// true = load into cache.
		} else {
			g.log('ERROR: need GeoLiteCity.dat installed to use geoip.');
		}
		if (path.existsSync(schema_config['geoip_db_path'] + '/GeoLiteCityv6.dat')) {
			cityIPv6 		= new GeoIPCityIPv6(schema_config['geoip_db_path'] + '/GeoLiteCityv6.dat', true);
		} else {
			g.log('ERROR: need GeoLiteCityv6.dat installed to use geoip.');
		}				
		if (path.existsSync(schema_config['geoip_db_path'] + '/GeoIP.dat')) {
			countryIPv4 	= new GeoIPCountryIPv4(schema_config['geoip_db_path'] + '/GeoIP.dat', true);
		} else {
			g.log('ERROR: need GeoIP.dat installed to use geoip.');
		}
		if (path.existsSync(schema_config['geoip_db_path'] + '/GeoIPv6.dat')) {
			countryIPv6 	= new GeoIPCountryIPv6(schema_config['geoip_db_path'] + '/GeoIPv6.dat', true);	
		} else {
			g.log('ERROR: need GeoIPv6.dat installed to use geoip.');
		}		
	}
	
	// if just geoip_country = true.
	if ( schema_config['geoip_country'] === true && schema_config['geoip_city'] === false ) {
		g.logDebug('loading geoip dbs and library.');
		// Maxmind GeoIP, using node client https://github.com/kuno/GeoIP
		var assert = require('assert'), geoip  = require('/usr/local/lib/node_modules/geoip');	// load library maybe located globally in: /usr/local/lib/node_modules/geoip
		var GeoIPCountryIPv4 = geoip.Country, GeoIPCountryIPv6 = geoip.Country6;
		if (path.existsSync(schema_config['geoip_db_path'] + '/GeoIP.dat')) {
			countryIPv4 	= new GeoIPCountryIPv4(schema_config['geoip_db_path'] + '/GeoIP.dat', true);
		} else {
			g.log('ERROR: need GeoIP.dat installed to use geoip.');
		}
		if (path.existsSync(schema_config['geoip_db_path'] + '/GeoIPv6.dat')) {
			countryIPv6 	= new GeoIPCountryIPv6(schema_config['geoip_db_path'] + '/GeoIPv6.dat', true);	
		} else {
			g.log('ERROR: need GeoIPv6.dat installed to use geoip.');
		}		
	}	
	
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
	//var regex = /^(\S+) (\S+) (\S+) \[(.*?)\] "(\S+.*?)" (\S+) (\S+) "(.*?)" "(.*?)"$/;
	var regex = /^(\S+) (\S+) (\S+) \[(.*?)\] "(\S+.*?)" (\S+) (\S+) "([^"]+)" "([^"]+)"( "([^"]+)"|)?$/;
	var values = message["message"].match(regex);  
	
	//g.dump(values);
	
	// verify values were extracted by regex from message.
	try {
		if ( values[1] == '' || values[3] == '' || values[5] == '' || values[6] == '' || values[8] == '' || values[9] == '' ) {
			g.logDebug('combined: message not valid value.');
			return false;													// not found.
		}
	} catch(verr) {
		g.logDebug('combined: message not valid value.');
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
	//values[8] = "http://www.example.com/start.html";
	//values[9] = "Mozilla/4.08 [en] (Win98; I ;Nav)";
	//values[10] = "USERID=Zepheira;IMPID=01234";

	// 0																	// guid.
	attributes_values['host'] = values[1];									// host.
	attributes_values['userid'] = values[3];								// userid.
	// 3																	// time.
	attributes_values['request'] = values[5];								// request.
	attributes_values['status_code'] = parseInt(values[6]);					// status_code.
	attributes_values['size'] = parseInt(values[7]);						// size.
	attributes_values['referer'] = values[8];								// referer.
	attributes_values['user_agent'] = values[9];							// user_agent.
	
	// cleanup cookie (sould be able to do this in regex above but cant figure it out!?) - remove serounding quotes.
	var cookie = values[10];												// cookie.
	if ( cookie != undefined ) {
		cookie = cookie.substring(2, cookie.length - 1);
		attributes_values['cookie'] = cookie;								// cookie.
	} else {
		attributes_values['cookie'] = '';									// cookie.
	}
	
	attributes_values['geo_country'] = '';									// geo_country 	(if geoip_country = true).	
	attributes_values['geo_city'] = '';										// geo_city 	(if geoip_city = true).
	attributes_values['geo_lat'] = '';										// geo_lat 		(if geoip_city = true).
	attributes_values['geo_lng'] = '';										// geo_lng 		(if geoip_city = true).		


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
					g.logDebug('combined: message not valid date value.');
					return false;											// not a valid date format!
				}
			} else {
				g.logDebug('combined: message not valid date value.');
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
	
	
	// if geoip
	if ( schema_config['geoip_country'] === true || schema_config['geoip_city'] === true ) {
		// Using synchronous method (as https://github.com/kuno/GeoIP recommends).
		
		var ip = attributes_values['host'];
		//g.logDebug('geoip: ' + ip);
	
		var ipType = 'IPv4';
		if ( ip.indexOf(':') > -1 ) {
			ipType = 'IPv6'; 	//IPv6
		}

		try {
			
			var geoMethodCountry = eval('country' + ipType);

			if ( schema_config['geoip_city'] === true ) {
				var geoMethodCity = eval('city' + ipType);
				var ip_geo_data = geoMethodCity.lookupSync(ip);
				if ( ip_geo_data === null ) {
					// sometimes if not found in city will return country info.
					ip_geo_data = geoMethodCountry.lookupSync(ip);
				}
			}
			
			if ( schema_config['geoip_country'] === true && schema_config['geoip_city'] === false ) {
				ip_geo_data = geoMethodCountry.lookupSync(ip);
			}

			if ( ip_geo_data === null ) { 
				g.logDebug('combined: message not geoip-able.');
				return false;												// will return message as false if cant geoip.
			}

			//for (var ipd in ip_geo_data) {
			//	g.logDebug('ip_f: ' + ipd + ' ip_v: ' + ip_geo_data[ipd]);
			//}
			
			attributes_values['geo_country'] = ip_geo_data['country_code'];
			if ( schema_config['geoip_city'] === true ) {
				var city = ip_geo_data['city'];
				if ( city != undefined ) {
					//city = city.replace(/'/g, "\\\'");					// delineate city apostraphies, eg: Saint John\'s.
					attributes_values['geo_city'] = city;
				}
				attributes_values['geo_lat'] = ip_geo_data['latitude'];
				attributes_values['geo_lng'] = ip_geo_data['longitude'];
			}
			if ( ip_geo_data['city'] == undefined ) {
				attributes_values['geo_city'] = '';
			}	
			if ( ip_geo_data['latitude'] == undefined ) {
				attributes_values['geo_lat'] = '';
			}	
			if ( ip_geo_data['longitude'] == undefined ) {
				attributes_values['geo_lng'] = '';
			}		
		
		} catch(err) {
			// geoip err, maybe the geoip databases are not installed!
			g.logDebug('ERR, combined, geoip, error message: ' + err);
			return;
		}
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
