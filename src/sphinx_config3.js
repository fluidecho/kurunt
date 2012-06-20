#!/usr/bin/env node
//
// Kurunt Sphinx Config
//
// Sphinx Dynamic Index Configuration File Generator (replaces default sphinx.conf with sphinx_config.js).
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


// To run: searchd --config ./sphinx_config.js
// Login to sphinx: mysql -h 127.0.0.1 -P 9306
// To stop sphinx: searchd --stop


var config_local		= 	require("../config.json");										// config settings.
var mysql				= require('/usr/local/lib/node_modules/mysql');						// native node.js mysql client.
//var sqlite		 	= 	require('/usr/local/lib/node_modules/sqlite3').verbose();		// using sqlite.

// mysql client to connect to kurunt mysql server.
var mysql_client = mysql.createConnection({	
	host: 		config_local['db_host'],
	port: 		config_local['db_port'],
	user: 		config_local['db_user'],
	password: 	config_local['db_pass'],
	database:	'kurunt',
	debug:		false
});	


// index
var sphinx_config_index = {
	"type"    			:   "rt", 
	"rt_mem_limit" 		:   config_local['sphinx_rt_mem_limit'],
	"path"       		:   config_local['sphinx_index_path'] + '/',
	"charset_type"		: 	config_local['sphinx_charset_type'],
	"rt_field" 			:   "foo",
	"rt_attr_bigint"	:	"ms",
	"rt_attr_string" 	:	"attr_values"
};


// indexer
var sphinx_config_indexer = {
	"mem_limit"    		:   config_local['sphinx_mem_limit']
};


// searchd
// note: dont need 'port' field if not using sphinx api.
var sphinx_config_searchd = {
	"workers"    		:   "threads",
	"port"				:	3312,
	"listen"    		:   9312,
	"listen"    		:   config_local['sphinx_port']+":mysql41",
	"workers"    		:   "threads",
	"log"    			:   "/var/sphinx/log/searchd.log",
	"query_log"    		:   "/var/sphinx/log/query.log",
	"binlog_path"    	:   "/var/sphinx/data",
	"rt_flush_period" 	: 	3600,
	"read_timeout"   	:   10,
	"pid_file"    		:   "/var/sphinx/log/searchd.pid",
	"max_matches"    	:   config_local['sphinx_max_matches'],
	"seamless_rotate"	:   1,
	"unlink_old"    	:   1,
	"max_children"		:	100
};


// index
function sphinx_index(schema, index_name, cb) {
	var i = 0;
	console.log("index " + index_name);
	console.log("{");
	
	for ( i in sphinx_config_index ) {
		if ( i === "path" ) {
			console.log(i + " = " + sphinx_config_index[i] + index_name);
		} else {
			console.log(i + " = " + sphinx_config_index[i]);
		}
	}
	
	// load config.json file to extract sphinx schema.
	var sphinx_schema = require(config_local['path'] + "/src/schemas/" + schema + "./config.json");
	//var sphinx_schema = require("./schemas/" + schema + "/config.json");
	
	for ( i in sphinx_schema['sphinx_schema'] ) {
		console.log(sphinx_schema['sphinx_schema'][i]['attr_type'] + ' = ' + sphinx_schema['sphinx_schema'][i]['attr_name']);
	}	
	
	console.log("}" + "\n");
	cb('');
}


// indexer
function sphinx_indexer() {
	var i = 0;
	console.log("indexer");
	console.log("{");
	for ( i in sphinx_config_indexer ) {
		console.log(i + " = " + sphinx_config_indexer[i]);
	}
	console.log("}" + "\n");
}


// searchd
function sphinx_searchd() {
	var i = 0;
	console.log("searchd");
	console.log("{");
	for ( i in sphinx_config_searchd ) {
		console.log(i + " = " + sphinx_config_searchd[i]);
	}
	console.log("}" + "\n");
}


//
// control script flow.
// 
console.log('# sphinx config file - dynamically created by kurunt (./sphinx_config.js)');

// using mysql.
mysql_client.query("SELECT * FROM data, indexes WHERE data.id=indexes.data_id AND type = 'sphinx'", function(err, results, fields) {
	if (err) { throw err; }
	console.log('# total indexes: ' + results.length + '\n');
	for ( var row in results ) {
		var index_name = results[row]['schema'] + '_' + results[row]['data_id'] + '_' + results[row]['version'];
		console.log('# index: ' + index_name);
		//console.log('cb: ' + results[row]['name']);
		sphinx_index(results[row]['schema'], index_name, function (cb) {
			// nothing to do.
		});
	}
	sphinx_indexer();
	sphinx_searchd();
	mysql_client.end();
});		
		
/* // using sqlite.
dbSelectLocal("SELECT * FROM data, indexes WHERE data.id=indexes.data_id AND type = 'sphinx'", function(result) {
	var x = 0;
	console.log('# total indexes: ' + result.length + '\n');
	for ( x in result ) {
		var index_name = result[x]['schema'] + '_' + result[x]['id'] + '_' + result[x]['version'];
		console.log('# index: ' + index_name);
		//console.log('cb: ' + result[x]['name']);
		sphinx_index(result[x]['schema'], index_name, function (cb) {
			// nothing to do.
		});
	}
	sphinx_indexer();
	sphinx_searchd();
});
function dbSelectLocal(sql, cb) { 
	var res = [];
    var db = new sqlite.Database(config_local['db'], function () {
		db.all(sql, 
		  function(err, rows) {
			if ( err ) {
				throw new Error(err)
			}
			if ( rows == '' ) {
				cb();
			}
			rows.forEach(function (row) {
				res.push(row);
			});
			db.close();
			cb( res );
		});
	});
}
 */