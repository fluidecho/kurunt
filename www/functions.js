//
// Kurunt Functions (locally accessible for www).
//
// Global functions (locally accessible for www).
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


// load dependencies.
var config 				= require("./config.json");							// this is your local www config settings.
var util 				= require('util');
var fs 					= require('fs');
var nimble 				= require('./nimble.min.js');											
var mysql				= require('/usr/local/lib/node_modules/mysql');		// native node.js mysql client.	


// set global variables.
var reports 			= [];
exports.reports			= reports;

var tables 				= [];
exports.tables			= tables;

var clients = {};
exports.clients			= clients;




var version 			= 0.1;												// kurunt version number.


var log 				= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };
var logDebug 			= function(txt) { if ( config['quiet_debug'] === false ) { console.log(txt); } };

var type 				= Function.prototype.call.bind( Object.prototype.toString );
var dump 				= function(vari) {
	//logDebug(type( vari ));
	if( type( vari ) === '[object String]' ) { 
		//logDebug('is string');
		var variable = vari.replace(/([\'\"])/g, '');
		try {
			variable = eval(variable);
			logDebug('DUMP> ' + vari + ': ' + util.inspect(variable, true, 99, true));
		} catch(e) {
			logDebug('DUMP> use without quotes!');
		}
	} else {
		//logDebug('is variable');
		logDebug(util.inspect(vari, true, 99, true));
	}
};


function startup(g, cb2) {

	nimble.series([
		function (callback) {	
		
			// run database schemas first!
			loadDatabaseSchema(function(cb3) {
				callback();						// local callback.	
			});	
			
		},	
		function (callback) {	

			// look within directory /reports/ to discover available reports.
			fs.readdir(config['www_path'] + '/reports', function(err, dirs){
				if(err) throw err;
				dirs.forEach(function(report){
					//logDebug('reprt: ' + report);
					// if  _ directories ignore.
					if ( report.substring(0, 1) != '_' ) {
						// add report
						logDebug('report to load: ' + report);
						reports[report] = require('./reports/'+report+'/index.js');
						reports[report]._load(g);
						reports[report]['config'] = require('./reports/'+report+'/config.json');
					}
				});
				logDebug('reports loaded');
				//values['reports'] = reports;
				
				callback();						// local callback.
				//cb2(reports);		
			});	
		
		},		
		function (callback) {				
			cb2();								// back to kurunt main.
		}
	]);

}


function loadDatabaseSchema(cb3) { 
	logDebug('loading database schema');
	
	// mysql client to connect to kurunt mysql server.
	var mysql_client_temp = mysql.createConnection({	
		host: 		config['db_host'],
		port: 		config['db_port'],
		user: 		config['db_user'],
		password: 	config['db_pass'],
		debug:		false
	});		

	mysql_client_temp.connect();
	
	mysql_client_temp.query("CREATE DATABASE IF NOT EXISTS kurunt", function(err, results, fields) {
		if (err) { throw err; }
		mysql_client_temp.query('USE kurunt');
		mysql_client_temp.query("CREATE TABLE IF NOT EXISTS `users` (`id` bigint(20) NOT NULL AUTO_INCREMENT,`email` varchar(250) COLLATE utf8_unicode_ci NOT NULL,`password` varchar(32) COLLATE utf8_unicode_ci NOT NULL,`api_key` varchar(32) COLLATE utf8_unicode_ci NOT NULL,`session_id` varchar(150) COLLATE utf8_unicode_ci NOT NULL,`status` int(11) NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `id` (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1", function(err, results, fields) {
			if (err) { throw err; }
			// default username = admin default password = md5('pass') eg: 1a1dc91c907325c69271ddf0c944bc72
			mysql_client_temp.query("INSERT IGNORE INTO users (`id`, `email`, `password`, `api_key`, `session_id`, `status`) VALUES (NULL, 'admin', '1a1dc91c907325c69271ddf0c944bc72', '', '', NULL)", function(err, result) {
				if (err) { throw err; }

				mysql_client_temp.query("SELECT * FROM users WHERE email = 'admin' AND password = '1a1dc91c907325c69271ddf0c944bc72'", function(err, rows, fields) {
					if (err) { throw err; }
					
					//logDebug('check if admin user has default password set');
					
					mysql_client_temp.end();
					if ( rows.length != 0 ) {
						//g.dump(rows);
						if ( rows[0]['status'] == 0 ) {
							//logDebug('check if admin user has default password set - YES');
							var freshUser = true;
						} else {
							var freshUser = false;
						}
						exports.freshUser		= freshUser;
					}
					cb3();
				});				
				
			});		

			
		});	
	});	
	
}


function user_session(req, res, cb4) { 
	logDebug('check user session');
	
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
	mysql_client_temp.query("SELECT * FROM users WHERE session_id = '" + req.sessionID + "'", function(err, rows, fields) {
		if (err) { throw err; }
		//dump(rows);
		if ( rows.length == 0 ) {
			logDebug('invalid user');
			mysql_client_temp.end();
			cb4(false);
		}
		
		try {
		
			if ( req.sessionID == rows[0].session_id ) {
				logDebug('valid user');
				mysql_client_temp.end();
				cb4(true);
			} else {
				mysql_client_temp.end();
				cb4(false);		
			}
		
		} catch(e) {
			cb4(false);					
		}
	});	
	
}


// convert degrees to radians.
function radians_decode(degrees) {
	var pi = Math.PI;
	var ra_de = (degrees)*(180/pi);
	return ra_de;
}
// convert radians to degrees.
function radians_encode(degrees) {
	var pi = Math.PI;
	var de_ra = (degrees)*(pi/180);
	return  de_ra;
}


var timer = function(){
	var start,
			end;
	
	return {
		start: function(){
			start = new Date().getTime();
		},
		stop: function(){
			end = new Date().getTime();
		},
		getTime: function(){
			return time = (end - start) / 1000;
		}
	};
}


// expose functions.
exports.startup				= startup;
exports.user_session		= user_session;
exports.log 				= log;
exports.logDebug 			= logDebug;
exports.dump 				= dump;
exports.radians_decode		= radians_decode;
exports.radians_encode		= radians_encode;
exports.timer				= timer;
