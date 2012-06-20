//
// Kurunt Twitter Schema
//
// Twitter Streamiong API (spritzer) schema.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var schema_config 								= require("./config.json");													// config settings for this schema.
var g 											= require("../../functions.js");											// global functions and variables.


// this function always gets called when kurunt first starts up (must always have _load function).
function _load() {
	g.log('*Loading ' + schema_config['title'] + ' Schema.');
	
	// Format JSON
	//
	// See documentation: 						https://dev.twitter.com/docs/api/1/get/statuses/sample
	// See data: 								https://stream.twitter.com/1/statuses/sample.json
	
}


// this function always gets called when etl.js processes the message (must always have process function).
function process(message) {
	//g.logDebug('*applying ' + schema_config['title'] + ' scheme');
	//g.dump(message);
	
	// remove unwanted characters.
	message["message"] 							= message["message"].replace(/\\n/gm, "");									// newlines.
	message["message"] 							= message["message"].replace(/\\r/gm, "");									// returns.
	message["message"]							= message["message"].replace(/\\t/gm, "");									// tabs.
	message["message"] 							= message["message"].replace(/  /gm, " ");									// whitespacing.
	
	try {
		message["message"] 						= JSON.parse(message["message"]);											// conver to from json string to js array.
	} catch(e) {
		return false;
	}
	
	// skip if not entities (tweet).
	if ( typeof(message["message"]["entities"]) == 'undefined') {
		return false;		// not tweet.
	}

	//g.dump(message["message"]);
	
	message.schema =  {
		"name"									: schema_config['name'],
		"engine"								: schema_config['engine'],
		"attributes"							: []
	};	
	
	
	// using JSON (JS array) extract message objects into schemed values (see config.json for attributes).
	var attributes_values 						= [];																		// from JSON message to attribute values.
	
	attributes_values['tweet_id']				= message["message"]["id"];
	attributes_values['user_screen_name'] 		= message["message"]["user"]["screen_name"];
	attributes_values['user_favourites_count'] 	= message["message"]["user"]["favourites_count"];
	attributes_values['user_followers_count'] 	= message["message"]["user"]["followers_count"];
	attributes_values['user_friends_count'] 	= message["message"]["user"]["friends_count"];	
	
	
	// currently just getting one user_mentions, the first in array, may add rt_attr_multi_64 support next version.
	attributes_values['user_mentions'] = [];
	for ( var key in message["message"]["entities"]["user_mentions"] ) {
		// elements: id: 181561712, indices[], id_str, screen_name, name
		attributes_values['user_mentions'] += message["message"]["entities"]["user_mentions"][key]["screen_name"]; // + ','
		break;	// just one (first).
	}
	//if ( attributes_values['user_mentions'].substring(attributes_values['user_mentions'].length - 1, attributes_values['user_mentions'].length) == ',' ) {
	//	attributes_values['user_mentions'] = attributes_values['user_mentions'].substring(0, attributes_values['user_mentions'].length - 1);
	//}

	// currently just getting one hashtags, the first in array, may add rt_attr_multi_64 support next version.
	attributes_values['hashtags'] = [];
	for ( var key in message["message"]["entities"]["hashtags"] ) {
		// elements: text, indices
		attributes_values['hashtags'] += message["message"]["entities"]["hashtags"][key]["text"]; // + ','
		break;	// just one (first).
	}
	//if ( attributes_values['hashtags'].substring(attributes_values['hashtags'].length - 1, attributes_values['hashtags'].length) == ',' ) {
	//	attributes_values['hashtags'] = attributes_values['hashtags'].substring(0, attributes_values['hashtags'].length - 1);
	//}
	
	// currently just getting one urls, the first in array, may add rt_attr_multi_64 support next version.
	attributes_values['urls'] = [];
	for ( var key in message["message"]["entities"]["urls"] ) {
		// elements: url, display_url, expanded_url
		attributes_values['urls'] += message["message"]["entities"]["urls"][key]["display_url"]; // + ','
		break;	// just one (first).
	}
	//if ( attributes_values['urls'].substring(attributes_values['urls'].length - 1, attributes_values['urls'].length) == ',' ) {
	//	attributes_values['urls'] = attributes_values['urls'].substring(0, attributes_values['urls'].length - 1);
	//}	
	
	
	attributes_values['text'] 					= message["message"]["text"];
	
	var clean_source					 		= message["message"]["source"];
	clean_source					 			= message["message"]["source"].replace(/<[^>]*>?/gm, '');					// strip html from source.
	attributes_values['source'] 				= clean_source;
	
	
	// time (as UTC unix timestamp)
	var message_time = message["message"]["created_at"];
	if ( schema_config['discover_message_date'] === true && message_time != '' ) {
	} else {
		// use now date in UTC (if system was not set to UTC)
		var now 								= new Date(); 
		var nowUTC 								= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		var nowUTCUnix 							= parseInt(nowUTC / 1000);													// unix timestamp.
		//g.logDebug('nowUTCUnix: ' + nowUTCUnix);	
		attributes_values['time'] 				= nowUTCUnix;																// date (unix timestamp).
		// use now time (local system time).
		//var dt 								= new Date; 																// generic JS date object.
		//var unixtime_ms 						= dt.getTime(); 															// milliseconds since the epoch.
		//var unixtime 							= parseInt(unixtime_ms / 1000);												// unix timestamp.
		//attributes_values['time']				= unixtime;																	// date (unix timestamp).
	}
	
	
	// for each attribute in config.json.
	for ( i in schema_config['sphinx_schema'] ) {
		//g.logDebug(schema_config['sphinx_schema'][i]['attr_type'] + ' = ' + schema_config['sphinx_schema'][i]['attr_name']);
		message.schema.attributes.push({
			"name"								: schema_config['sphinx_schema'][i]['attr_name'],
			"type"								: schema_config['sphinx_schema'][i]['attr_type'],
			"value" 							: attributes_values[schema_config['sphinx_schema'][i]['attr_name']],
			"id"								: -1
		});
	}
	
	
	return message;																											// returned schemed message.
	
}


// _admin_onNew is called when the admin user opens (new data) this schema.
function _admin_onNew(values) {
	
	// display message if the twitteri (input) config setting for twitter_user and twitter_pass are not set.
	
	var input_config = require("../../inputs/twitteri/config.json");	
	
	if ( input_config['twitter_user'] == '' || input_config['twitter_pass'] == '' ) {
	
		values['notice'] = 'This schema requires your Twitter username and password to be set. You will need to enter these details in ' + input_config['path'] + '/config.json file at twitter_user and twitter_pass. After this you will need to restart Kurunt.';
		values['_admin_onNew'] = -1;
		
		return values;
		
	}
	
	return true;

}

// expose functions.
exports._load = _load;
exports.process = process;
exports._admin_onNew = _admin_onNew;
