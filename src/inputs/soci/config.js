//
// Soci Config
//
// Replaces config.json file 'open_posts' with sqlite data.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config			= require("./config.json");											// this is your config settings, like ports to open.
var mysql			= require('/usr/local/lib/node_modules/mysql');						// native node.js mysql client.
//var sqlite		= require('/usr/local/lib/node_modules/sqlite3').verbose();			// using sqlite.


function openPosts(callback) { 

	// mysql client to connect to kurunt mysql server.
	if ( config['run_standalone'] === true ) {
		var mysql_client = mysql.createConnection({	
			host: 		config['db_host'],
			port: 		config['db_port'],
			user: 		config['db_user'],
			password: 	config['db_pass'],
			database:	'kurunt',
			debug:		false
		});	
	} else {
		var config_g	= require("../../../config.json");
		var mysql_client = mysql.createConnection({	
			host: 		config_g['db_host'],
			port: 		config_g['db_port'],
			user: 		config_g['db_user'],
			password: 	config_g['db_pass'],
			database:	'kurunt',
			debug:		false
		});		
	}
	
	var ports = [];

	// using mysql.
	mysql_client.query("SELECT port FROM data WHERE input = '" + config['name'] + "' AND status != 'closed' LIMIT 0, 99", function(err, results, fields) {
		if (err) { throw err; }
		if ( results.length == 0 ) {
			callback();
		}	
		for ( var row in results ) {
			//console.log('PORT: ' +  results[row]['port']);
			ports.push({port: results[row]['port']});
		}
		mysql_client.end();
		callback( ports );
	});		
	
	// using sqlite.
    /* var db = new sqlite.Database(config['db'], function () {
		db.all("SELECT port FROM data WHERE input = '" + config['name'] + "' AND status != 'closed' LIMIT 0, 99", 
		  function(err, rows) {
			if ( err ) {
				throw new Error(err)
			}
			if ( rows == '' ) {
				callback();
			}
			rows.forEach(function (row) {
				//log(row.id + ": input: " + row.input + " schema: " + row.schema + " port: " + row.port + " status: " + row.status);
				ports.push({port: row.port});
			});
			db.close();
			callback( ports );
		});
	}); */

}


exports.openPosts = openPosts;		// expose.