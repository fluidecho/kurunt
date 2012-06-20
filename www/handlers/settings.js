//
// Kurunt www - Query Handler
//
// Web pages for managing Kurunt.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config 				= require("../../config.json");							// kurunt: this is your config settings.  
var g 					= require("../../src/functions.js");					// global functions and variables.
var nimble 				= require('../../src/nimble.min.js');	
var mysql				= require('/usr/local/lib/node_modules/mysql');		// native node.js mysql client.	
var crypto 				= require('crypto');


function _request(req, res, config, g, lg, cb) {
	
	var returned = 0;
		
	var new_password = req.param('new_password');
	g.logDebug('new_password: ' + new_password);

	if ( new_password == '' ) {
		returned = 'Password must have a value!';
		cb(returned);
		return;
	}
	
	if ( new_password != undefined && new_password != '' ) {
	
		// mysql client to connect to kurunt mysql server.
		var mysql_client_temp = mysql.createConnection({	
			host: 		config['db_host'],
			port: 		config['db_port'],
			user: 		config['db_user'],
			password: 	config['db_pass'],
			debug:		false
		});	

		mysql_client_temp.connect();
		
		var noUsersSetup = true;
		
		mysql_client_temp.query('USE kurunt');
		
		mysql_client_temp.query("INSERT INTO users (`id`, `email`, `password`, `api_key`, `session_id`, `status`) VALUES (NULL, 'admin', '" + crypto.createHash('md5').update(new_password).digest("hex") + "', '', '" + req.sessionID + "', '1') ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status)", function(err, result) {
			if (err) { throw err; }
			mysql_client_temp.end();
		});		
		lg.freshUser = false;
		returned = 'Saved.';
	
	}
	cb(returned);
	
	
}




exports._request 		= _request;												// expose.