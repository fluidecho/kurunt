//
// Webi Config
//
// Replaces config.json file 'open_posts' with sqlite data.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config		= require("./config.json");									// this is your config settings, like ports to open.
// install: npm install sqlite3 [-g]
var sqlite 		= require('/usr/local/lib/node_modules/sqlite3').verbose();

// SQLite DB Schema.
// CREATE TABLE data(id INTEGER PRIMARY KEY NOT NULL, input TEXT NOT NULL, schema TEXT, port INTEGER, status TEXT)
// CREATE INDEX input ON data (input ASC)
// INSERT INTO data (id,input,schema,port,status) VALUES (NULL,'tcp','default','9355','open')


function openPosts(callback) { 

	var ports = [];

    var db = new sqlite.Database(config['db'], function () {
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
	});

}


exports.openPosts = openPosts;		// expose.