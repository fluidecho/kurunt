//
// Kurunt Digg Schema
//
// Digg Streamiong API schema.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var schema_config 					= require("./config.json");																// config settings for this schema.
var g 								= require("../../functions.js");														// global functions and variables.


// this function always gets called when kurunt first starts up (must always have _load function).
function _load() {
	g.log('*Loading ' + schema_config['title'] + ' Schema.');
	
	// Format JSON - see sample.json
	//
	// See documentation: 			http://developers.digg.com/version2/stream
	// See data: 					http://services.digg.com/2.0/stream
	
}


// this function always gets called when etl.js processes the message (must always have process function).
function process(message) {
	//g.logDebug('*applying ' + schema_config['title'] + ' scheme');
	//g.dump(message);
	
	// remove unwanted characters.
	message["message"] 				= message["message"].replace(/\\n/gm, "");												// newlines.
	message["message"] 				= message["message"].replace(/\\r/gm, "");												// returns.
	message["message"]				= message["message"].replace(/\\t/gm, "");												// tabs.
	message["message"] 				= message["message"].replace(/  /gm, " ");												// whitespacing.
	
	try {
		message["message"] 			= JSON.parse(message["message"]);											// conver to from json string to js array.
	} catch(e) {
		return false;
	}
	
	// strip html from title and description, occasional message show spamy <iframe, <img etc.
	message["message"]["item"]["title"] 		= message["message"]["item"]["title"].replace(/<[^>]*>?/gm, '');
	message["message"]["item"]["description"] 	= message["message"]["item"]["description"].replace(/<[^>]*>?/gm, '');
	
	// truncate title and description.
	message["message"]["item"]["title"] 		= message["message"]["item"]["title"].substring(0, 256);					// title.
	message["message"]["item"]["description"] 	= message["message"]["item"]["description"].substring(0, 512);				// description.
	
	//g.dump(message["message"]);
	
	message.schema =  {
		"name"						: schema_config['name'],
		"engine"					: schema_config['engine'],
		"attributes"				: []
	};	
	
	
	// using JSON (JS array) extract message objects into schemed values (see config.json for attributes).
	var attributes_values 			= [];																					// from JSON message to attribute values.
	
	attributes_values['guid'] = Math.floor(Math.random()*9223372036854775806);												// guid (random 64 bit signed int).
	attributes_values['item_id'] = message["message"]["item"]["id"];														// item_id.
	attributes_values['title'] = message["message"]["item"]["title"];														// title.
	attributes_values['description'] = message["message"]["item"]["description"];											// description.
	
	if ( typeof message["message"]["item"]["thumbnail"] !== 'undefined' ) {
		attributes_values['thumbnail'] = message["message"]["item"]["thumbnail"]["src"];									// thumbnail (if).
	} else {
		attributes_values['thumbnail'] = '';
	}
	
	attributes_values['submit_date'] = message["message"]["item"]["submit_date"];											// submit_date (message first submited to digg).
	attributes_values['date'] = message["message"]["date"];																	// date (message recieved by digg).
	attributes_values['diggs'] = message["message"]["item"]["diggs"];														// diggs.
	attributes_values['comments'] = message["message"]["item"]["comments"];													// comments.
	
	if ( typeof message["message"]["item"]["topic"] !== 'undefined' ) {
		attributes_values['topic'] = message["message"]["item"]["topic"]["name"];											// topic (if).
	} else {
		attributes_values['topic'] = '';
	}	
	
	attributes_values['link'] = message["message"]["item"]["link"];															// link.
	
	attributes_values['user_name'] = message["message"]["user"]["name"];													// user name.
	attributes_values['user_fullname'] = message["message"]["user"]["fullname"];											// user fullname.
	attributes_values['user_icon'] = message["message"]["user"]["icon"];													// user icon.	
	
	attributes_values['type'] = message["message"]["type"];																	// type (submission, digg, comment).

	// date (as UTC unix timestamp)
	var message_time = message["message"]["item"]["date"];
	if ( schema_config['discover_message_date'] === true && message_time != '' ) {
	} else {
		// use now date in UTC (if system was not set to UTC)
		var now 					= new Date(); 
		var nowUTC 					= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		var nowUTCUnix 				= parseInt(nowUTC / 1000);																// unix timestamp.
		//g.logDebug('nowUTCUnix: ' + nowUTCUnix);	
		attributes_values['date'] 	= nowUTCUnix;																			// date (unix timestamp).
		// use now time (local system time).
		//var dt 					= new Date; 																			// generic JS date object.
		//var unixtime_ms 			= dt.getTime(); 																		// milliseconds since the epoch.
		//var unixtime 				= parseInt(unixtime_ms / 1000);															// unix timestamp.
		//attributes_values['date'] = unixtime;																				// date (unix timestamp).
	}
	
	
	// for each attribute in config.json.
	for ( i in schema_config['sphinx_schema'] ) {
		//g.logDebug(schema_config['sphinx_schema'][i]['attr_type'] + ' = ' + schema_config['sphinx_schema'][i]['attr_name']);
		message.schema.attributes.push({
			"name"					: schema_config['sphinx_schema'][i]['attr_name'],
			"type"					: schema_config['sphinx_schema'][i]['attr_type'],
			"value" 				: attributes_values[schema_config['sphinx_schema'][i]['attr_name']],
			"id"					: -1
		});
	}
	
	
	return message;																											// returned schemed message.
	
}


// expose functions.
exports._load = _load;
exports.process = process;
