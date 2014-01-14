//
// Kurunt, Logging
//
// Logging function, as set within config.logging = quiet (default) | benchmark | debug.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//



var util = require('util');
var config = require('.././config.json');


module.exports.benchmark = function (txt) {

	if ( config['logging'] === 'benchmark' || config['logging'] === 'debug' ) {
		console.log(txt);
	}
	
	return true;
	
};


module.exports.log = function (txt, dump) {

	if ( config['logging'] === 'debug' ) {
		if ( dump != undefined ) {
			console.log(txt + ' >> ' + util.inspect(dump, true, 99, true));		// dump-out all variable properties.
		} else {
			console.log(txt);
		}
	} else {
		// nada, quiet.
	}
	
	return true;
	
};

