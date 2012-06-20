//
// Kurunt Pixel Schema
//
// Web Analytics Pixel Format schema.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var schema_config 						= require("./config.json");								// config settings for this schema.
var crypto 								= require('crypto');
var path								= require('path');
var g 									= require("../../functions.js");						// global functions and variables.


// this function always gets called when kurunt first starts up (must always have _load function).
function _load() {
	g.log('*Loading ' + schema_config['title'] + ' Schema.');
	
	// LogFormat JSON:
	// SAMPLE:
	// {
		// "port": 9999,
		// "handler": "*",
		// "client_address": "10.10.10.10",
		// "client_port": 80,
		// "cookie": "PHPSESSID=dn4nkupbrsf3glvo2hio2lh5k3",
		// "request": "/5223372036854555301.gif?referral=www.google.com.au",		
		// "referer": "http://foo.com/bar.htm",
		// "language": "en-AU,en-US;q=0.8,en;q=0.6",		
		// "user_agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/555.55 (KHTML, like Gecko) Chrome/18.0.1055.555 Safari/555.55",
		// "time": 1335761347,
		// "time_hour": 1335758400,
		// "message": "pixel\n"
	// }
	// See /src/inputs/pixi/handlers.js.
	
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
	//g.dump(message);
	
	// truncate title and description.
	//message["message"]["item"]["title"] = message["message"]["item"]["title"].substring(0, 256);					// title.
	//message["message"]["item"]["description"] = message["message"]["item"]["description"].substring(0, 512);		// description.
	
	message.schema =  {
		"name"							: schema_config['name'],
		"engine"						: schema_config['engine'],
		"attributes"					: []
	};	
	
	// using JSON (JS array) extract message objects into schemed values (see config.json for attributes).
	var attributes_values 				= [];													// from JSON message to attribute values.
	
	// see if request has a gif within and make that the pixel identifier.
	var pixel = '';
	var posPixel = message["request"].indexOf('.gif');
	if ( posPixel != -1 ) {
		pixel = message["request"].substring(1, posPixel);
		var pixelInt = parseInt(pixel);	
		if ( !isNaN(pixelInt) ) {
			pixel = pixelInt;
		}
	}
	attributes_values['pixel'] 			= pixel;												// pixel.
	
	//var ip							= message["client_address"];							// ip.
	var ip				 				= '124.191.73.158';										// ip.
	attributes_values['ip_md5']			= crypto.createHash('md5').update(ip).digest("hex");	// ip, md5 hased - for privacy, dont need to store origional.
	 
	attributes_values['cookie'] 		= message["cookie"];									// cookie.
	attributes_values['time'] 			= message["time"];										// time.
	attributes_values['request'] 		= message["request"];									// request.
	attributes_values['referer'] 		= message["referer"];									// referer.
	
	// extract referral from request if exist (note asumes referral is trailing param of request url).
	attributes_values['referral'] 		= '';
	var posReferral						= message["request"].indexOf('referral=');
	if ( posReferral != -1 ) {
		attributes_values['referral'] 	= message["request"].substring(posReferral + 9);		// referral.
	}
	
	// trim/transform language to just essential.
	var language 						= message["language"];									// EG: en-AU,en-US;q=0.8,en;q=0.6
	var posLangComma					= language.indexOf(',');
	if ( posLangComma < 1 ) {
		posLangComma					= language.length;
	}
	language							= language.substring(0, posLangComma);
	language			 				= language.toLowerCase();
	attributes_values['language'] 		= language;												// language.
	
	attributes_values['user_agent'] 	= message["user_agent"];								// user_agent.

	// create a guid combining: pixel, referer, host (ip address), user agent and time to hour as MD5 hash (reason for hourly is so can poll 'count once in statistics' this visitor over the hour).
	var guid 							= crypto.createHash('md5').update(pixel+attributes_values['referer']+ip+attributes_values['user_agent']+message["time_hour"]).digest("hex");
	attributes_values['guid'] 			= guid;													// guid.
	message['id']						= guid;
	
	// geoip.
	attributes_values['geo_country'] 	= '';
	attributes_values['geo_city'] 		= '';
	attributes_values['geo_lat'] 		= '';
	attributes_values['geo_lng'] 		= '';

	// date (as UTC unix timestamp)
	var message_time = message["time"];
	if ( schema_config['discover_message_date'] === true && message_time != '' ) {
	} else {
		// use now date in UTC (if system was not set to UTC)
		var now 						= new Date(); 
		var nowUTC 						= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		var nowUTCUnix 					= parseInt(nowUTC / 1000);								// unix timestamp.
		//g.logDebug('nowUTCUnix: ' + nowUTCUnix);	
		attributes_values['time'] 		= nowUTCUnix;											// date (unix timestamp).
		// use now time (local system time).
		//var dt 						= new Date; 											// generic JS date object.
		//var unixtime_ms 				= dt.getTime(); 										// milliseconds since the epoch.
		//var unixtime 					= parseInt(unixtime_ms / 1000);							// unix timestamp.
		//attributes_values['time'] 	= unixtime;												// date (unix timestamp).
	}
	

	// if geoip
	if ( schema_config['geoip_country'] === true || schema_config['geoip_city'] === true ) {
		// Using synchronous method (as https://github.com/kuno/GeoIP recommends).
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
				g.logDebug('pixel: message not geoip-able.');
				return false;																	// will return message as false if cant geoip.
			}

			//for (var ipd in ip_geo_data) {
			//	g.logDebug('ip_f: ' + ipd + ' ip_v: ' + ip_geo_data[ipd]);
			//}
			
			attributes_values['geo_country'] = ip_geo_data['country_code'];
			if ( schema_config['geoip_city'] === true ) {
				var city = ip_geo_data['city'];
				if ( city != undefined ) {
					//city = city.replace(/'/g, "\\\'");										// delineate city apostraphies, eg: Saint John\'s.
					attributes_values['geo_city'] = city;
				}
				attributes_values['geo_lat'] = ip_geo_data['latitude'];
				attributes_values['geo_lng'] = ip_geo_data['longitude'];
			}
			if ( ip_geo_data['city'] == undefined ) {
				attributes_values['geoip_city'] = '';
			}	
			if ( ip_geo_data['latitude'] == undefined ) {
				attributes_values['geo_lat'] = '';
			}	
			if ( ip_geo_data['longitude'] == undefined ) {
				attributes_values['geo_lng'] = '';
			}		
		
		} catch(err) {
			// geoip err, maybe the geoip databases are not installed!
			g.logDebug('ERR, pixel, geoip, error message: ' + err);
			return;
		}
	}
	
	
	// for each attribute in config.json.
	for ( i in schema_config['sphinx_schema'] ) {
		//g.logDebug(schema_config['sphinx_schema'][i]['attr_type'] + ' = ' + schema_config['sphinx_schema'][i]['attr_name']);
		message.schema.attributes.push({
			"name"						: schema_config['sphinx_schema'][i]['attr_name'],
			"type"						: schema_config['sphinx_schema'][i]['attr_type'],
			"value" 					: attributes_values[schema_config['sphinx_schema'][i]['attr_name']],
			"id"						: -1
		});
	}

	return message;						// returned schemed message.
	
}


// expose functions.
exports._load 							= _load;
exports.process 						= process;




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
