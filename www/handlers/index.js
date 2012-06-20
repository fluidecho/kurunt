//
// Kurunt www - Index Handler
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
	//res.send('401', 401);
	//g.dump(req);
	g.logDebug('check user has valid auth');
	var user_valid = false;		// check is valid to be true.
	
	
	var username = req.param('username');
	g.logDebug('username: ' + username);
	
	var password = req.param('password');
	g.logDebug('password: ' + password);		


	var signout = req.param('signout');
	g.logDebug('signout: ' + signout);	
	
	g.log(req.sessionID);

	
	if ( username != undefined && password != undefined ) {
			
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
		
		mysql_client_temp.query("SELECT * FROM users WHERE email = '" + username + "' AND password = '" + crypto.createHash('md5').update(password).digest("hex") + "'", function(err, rows, fields) {
			if (err) { throw err; }
			
			if ( rows.length != 0 ) {
				//g.dump(rows);
				if ( rows[0]['status'] == 1 ) {
					mysql_client_temp.query("UPDATE users SET `session_id` = '" + req.sessionID + "' WHERE email = '" + username + "' AND password = '" + crypto.createHash('md5').update(password).digest("hex") + "'", function(err, rows, fields) {
						if (err) { throw err; }
						lg.logDebug('login ok - goto data');
						mysql_client_temp.end();
						cb(2);
						return;							
					});		
				
				} else {
					mysql_client_temp.query("UPDATE users SET `session_id` = '" + req.sessionID + "' WHERE email = '" + username + "' AND password = '" + crypto.createHash('md5').update(password).digest("hex") + "'", function(err, rows, fields) {
						if (err) { throw err; }
						lg.logDebug('login ok - goto settings');
						mysql_client_temp.end();
						cb(1);
						return;							
					});		
				}
				return;			
			} else {
				lg.logDebug('login fail');				
				cb(0);		// fail
				return;		
			}
		});		

	} else if ( signout == 'true' ) {
		lg.logDebug('signout this user');
		
		// mysql client to connect to kurunt mysql server.
		var mysql_client_temp = mysql.createConnection({	
			host: 		config['db_host'],
			port: 		config['db_port'],
			user: 		config['db_user'],
			password: 	config['db_pass'],
			debug:		false
		});	

		mysql_client_temp.connect();		
		mysql_client_temp.query('USE kurunt');
		mysql_client_temp.query("UPDATE users SET `session_id` = '' WHERE session_id = '" + req.sessionID + "'", function(err, rows, fields) {
			if (err) { throw err; }
			mysql_client_temp.end();
			cb(0);
			return;							
		});		
	} else {
		lg.logDebug('login invalid');				
		cb(0);		// fail
		return;		
	}
					

	
	
}




exports._request 		= _request;												// expose.