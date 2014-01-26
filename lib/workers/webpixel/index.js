//
// Kurunt Web Pixel Worker
//
// Web Pixel 'worker' for Kurunt, processing clickstream data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: mixed
  //
  // See: http://docs.kurunt.com/WebPixel_Worker
  
  //console.log('webpixel@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
  // use try catch so can skip over invalid messages.
  try {

    var webreq = JSON.parse(message.message.toString(wk['config']['encoding']));
    //console.log('webpixel@workers> webreq: ' + require('util').inspect(webreq, true, 99, true));
    
    // add values to this attribute (by unique name for all stores: schema), which get's added to this messages: stores: schema.
    var attributes = [];

    attributes['client_ip'] = webreq.client_ip;
    attributes['client_port'] = webreq.client_port;
    attributes['pathname'] = webreq.pathname;
    attributes['language'] = webreq.language;
    attributes['user_agent'] = webreq.user_agent;
    attributes['referer'] = webreq.referer;
    attributes['cookie'] = webreq.cookie;

    // add your own geoip, such as maxmind [http://dev.maxmind.com/geoip/geoip2/geolite2/] with a node module like geoip-lite [https://github.com/bluesmoon/node-geoip].
    // var geo = geoip.lookup(webreq.client_ip);
    // { range: [ 3479299040, 3479299071 ], country: 'US', region: 'CA', city: 'San Francisco', ll: [37.7484, -122.4156] }    
    attributes['geo_country'] = '';
    attributes['geo_city'] = '';
    attributes['geo_lat'] = '';
    attributes['geo_lng'] = '';

    attributes['query'] = webreq.query;

    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('webpixel@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};


var config = {
  "name": "webpixel",
  "title": "Web Pixel", 
  "description": "Web Pixel, for processing clickstream data.",
  "icon": "",
  "url": "http://docs.kurunt.com/WebPixel_Worker",
  "version": 0.2, 
  "date_mod": "10/22/2013",
  "inputs": [ "http" ],
  "reports": [ "stream" ],
  "encoding": "utf8",
  "stores": [
    {
      "stream": {
        "schema": {
          "client_ip": { },
          "client_port": { },
          "pathname": { },
          "referer": { },
          "language": { },
          "user_agent": { },
          "cookie": { },
          "geo_country": { },
          "geo_city": { },
          "geo_lat": { },
          "geo_lng": { },                                       
          "query": { }
        }
      }
    },
    {
      "mongo": {
        "schema": {
          "client_ip": { },
          "client_port": { },
          "pathname": { },
          "referer": { },
          "language": { },
          "user_agent": { },
          "cookie": { },
          "geo_country": { },
          "geo_city": { },
          "geo_lat": { },
          "geo_lng": { },                                       
          "query": { }
        }
      }
    },
    {
      "redis": {
        "schema": {
          "client_ip": { },
          "client_port": { },
          "pathname": { },
          "referer": { },
          "language": { },
          "user_agent": { },
          "cookie": { },
          "geo_country": { },
          "geo_city": { },
          "geo_lat": { },
          "geo_lng": { },                                       
          "query": { }
        }
      }
    },
		{
			"mysql": {
				"schema": {
          "client_ip": { "type": "varchar(64)" },
          "client_port": { "type": "MEDIUMINT" },
          "pathname": { "type": "varchar(512)" },
          "referer": { "type": "varchar(512)" },
          "language": { "type": "varchar(256)" },
          "user_agent": { "type": "varchar(512)" },
          "cookie": { "type": "varchar(512)" },
          "geo_country": { "type": "varchar(256)" },
          "geo_city": { "type": "varchar(512)" },
          "geo_lat": { "type": "FLOAT" },
          "geo_lng": { "type": "FLOAT" },                                       
          "query": { "type": "varchar(512)" }					
				}
			}
		}        
  ]
};
exports.config = config;		// must export the config so kurunt can read it.

//var geoip = undefined;
//module.exports.init = function () {
//  var geoip = require('geoip-lite');
//};

