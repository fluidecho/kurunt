//
// Kurunt Functions
//
// Global functions.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


// load dependencies.
var config 				= require("../config.json");						// this is your config settings.
var util 				= require('util');
var fs 					= require('fs');
var zmq 				= require('/usr/local/lib/node_modules/zmq');
//var sqlite 				= require('/usr/local/lib/node_modules/sqlite3').verbose();
var nimble 				= require('./nimble.min.js');											
var crypto 				= require('crypto');
var launcher 			= require('./launch.js');							// for launching daemon like node.js programs.


//
// SQLite DB Schema.
// data table.
// CREATE TABLE IF NOT EXISTS data(id INTEGER PRIMARY KEY NOT NULL, input TEXT NOT NULL, schema TEXT, port INTEGER, status TEXT)
// CREATE INDEX input ON data (input ASC)
// INSERT INTO data (id,input,schema,port,status) VALUES (NULL,'tcp','default','9355','open')
// index table (version = index number for this data, eg combined_1_2 = the second index for data_id 1).
// CREATE TABLE IF NOT EXISTS indexes(id INTEGER PRIMARY KEY NOT NULL, type TEXT, name TEXT, data_id INTEGER, version INTEGER)
// INSERT INTO indexes (id,type,name,data_id,version) VALUES ('1','sphinx','combined_1_1','1','1')
//


// set global variables.
var data 						= [];												// data inputs.
exports.data					= data;												// data (global expose).
var indexes 					= [];												// sphinx indexes.
exports.indexes					= indexes;											// indexes (global expose).
var settings					= [];												// settings, like users.
exports.settings				= settings;											// settings (global expose).
var schemas						= [];												// data input schemas, like: apache, default, digg, or user created etc.
exports.schemas					= schemas;											// schemas (global expose).
var inputs						= [];												// data input apps, like: soci, pixi or user created etc.
exports.inputs					= inputs;											// inputs (global expose).

var mysql						= require('/usr/local/lib/node_modules/mysql');		// native node.js mysql client.
exports.mysql					= mysql;											// mysql (global expose).
var mysql_sphinx_client			= '';												
exports.mysql_sphinx_client		= mysql_sphinx_client;								// mysql_sphinx_client (global expose).
var mysql_client 				= ''; 
exports.mysql_client			= mysql_client;										// mysql_client (global expose).


var version 					= 0.1;												// kurunt version number.


var log 		= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };
var logDebug 	= function(txt) { if ( config['quiet_debug'] === false ) { console.log(txt); } };

var type 		= Function.prototype.call.bind( Object.prototype.toString );
var dump 		= function(vari) {
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


function startup(cb) {

	// copyright statement - required.
	console.log('Welcome to Kurunt (http://kurunt.org).\nVersion '+version+' (Apache License 2.0).\n\nCopyright (c) 2012 Mark W. B. Ashcroft.\nCopyright (c) 2012 Kurunt.\n\nType ctrl+c to exit the program.\n>>>');

	log('*Loading Kurunt');
	
	process.on('uncaughtException', function(err) {
		log('uncaughtException: ' + err);
	});	
	
	// run database schemas first!
	loadDatabaseSchema(function(cb2) {

		// nimble parallel functions, with a single callback function.
		nimble.parallel({
			data: function(callback){
				loadData(function() {
					callback(null, data);
				});
			},
			schemas: function (callback){
				loadSchemas(function() {
					callback(null, data);
				});
			},
			inputs: function (callback){
				loadInputs(function() {
					callback(null, data);
				});
			},		
			indexes: function (callback){
				loadIndexes(function() {
					callback(null, data);
				});
			}		
		},
		// RESULTS
		function(err, results) {
		log("*finished loading.");
			cb(data);				// callback for nimble.parallel
		});

	});	

} // end startup.


function dbSelect(sql, cb) { 
	var res = [];
    var db = new sqlite.Database(config['db'], function () {
		db.all(sql, 
		  function(err, rows) {
			if ( err ) {
				throw new Error(err)
			}
			if ( rows == '' ) {
				cb();
			}
			rows.forEach(function (row) {
				//log(row.id + ": input: " + row.input + " schema: " + row.schema + " port: " + row.port + " status: " + row.status);
				res.push(row);
			});
			db.close();
			cb( res );
		});
	});
}


function loadDatabaseSchema(cb) { 
	logDebug('loading database schema');

	// mysql client to connect to kurunt mysql server.
	var mysql_client_temp = mysql.createConnection({	
		host: 		config['db_host'],
		port: 		config['db_port'],
		user: 		config['db_user'],
		password: 	config['db_pass'],
		debug:		false
	});		
	
	mysql_client_temp.query("CREATE DATABASE IF NOT EXISTS kurunt", function(err, results, fields) {
		if (err) { throw err; }
		mysql_client_temp.query('USE kurunt');
		mysql_client_temp.query("CREATE TABLE IF NOT EXISTS `data` (`id` bigint(20) NOT NULL AUTO_INCREMENT,`input` varchar(255) COLLATE utf8_unicode_ci NOT NULL,`schema` varchar(255) COLLATE utf8_unicode_ci NOT NULL,`port` smallint(6) NOT NULL,`status` varchar(100) COLLATE utf8_unicode_ci NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `id` (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1", function(err, results, fields) {
			if (err) { throw err; }
			mysql_client_temp.query("CREATE TABLE IF NOT EXISTS `indexes` (`id` bigint(20) NOT NULL AUTO_INCREMENT,`type` varchar(255) COLLATE utf8_unicode_ci NOT NULL,`data_id` bigint(20) NOT NULL,`version` bigint(20) NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `id` (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1", function(err, results, fields) {
				if (err) { throw err; }
				
				mysql_client_temp.end();
	
				// mysql client to connect to kurunt mysql server.
				mysql_client = mysql.createConnection({	
					host: 		config['db_host'],
					port: 		config['db_port'],
					user: 		config['db_user'],
					password: 	config['db_pass'],
					database:	'kurunt',
					debug:		false
				});				
				
				cb();
			});	
		});	
	});	
	
	
	
/* 	var db = new sqlite.Database(config['db'], function () {
		db.serialize(function() {
			db.run("CREATE TABLE IF NOT EXISTS data(id INTEGER PRIMARY KEY NOT NULL, input TEXT NOT NULL, schema TEXT, port INTEGER, status TEXT)", function() {
				db.run("CREATE TABLE IF NOT EXISTS indexes(id INTEGER PRIMARY KEY NOT NULL, type TEXT, data_id INTEGER, version INTEGER)", function () {
					cb();
				});
			});
		});
	}); */
}


function loadData(cb) { 
	logDebug('loading data');
	//dbSelect("SELECT * FROM data WHERE status != 'closed' LIMIT 0, 99", function(result) {
	mysql_client.query("SELECT * FROM data", function(err, results, fields) {
		if (err) { throw err; }
		for ( var row in results ) {
			//logDebug('cb: ' + result[x]['schema']);
			//data.push(result[x]);
			var port_string = '"' + results[row]['port'] + '"' + '';
			data[port_string] = results[row];
		}
		logDebug('data loaded');
		cb();
	});
}


function loadSchemas(cb) { 
	logDebug('loading schemas');
	// look within directory /src/schemas/ to discover available schemas.
	fs.readdir(config['path'] + '/src/schemas', function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(schema){
			logDebug('schema: ' + schema);
			// if /src/schema/_myschema will ignore _ directories.
			if ( schema.substring(0, 1) != '_' ) {
				// add schema
				logDebug('schema to load: ' + schema);
				schemas[schema] = require('./schemas/'+schema+'/index.js');
				schemas[schema]._load();
				schemas[schema]['config'] = require('./schemas/'+schema+'/config.json');
			}
		});
		logDebug('schemas loaded');
		cb();
	});
	// dont load from db because they may not currently be in use within 'data' table - too be setup, so look through /src/schemas/*
/* 	dbSelect("SELECT schema FROM data GROUP BY schema", function(result) {
		var x = 0;
		for ( x in result ) {
			logDebug('schema to load: ' + result[x]['schema']);
			schemas[result[x]['schema']] = require('./schemas/'+result[x]['schema']+'/index.js');
			schemas[result[x]['schema']]._load();
		}
		logDebug('schema loaded');
		cb();
	}); */
}


function loadInputs(cb) { 
	logDebug('loading inputs');
	//cb();
	//return;
	
	// look within directory /src/inputs/ to discover available inputs.
	
	// load inputs nativly through node require.
	fs.readdir(config['path'] + '/src/inputs', function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(input){
			logDebug('inputs: ' + input);
			// if /src/inputs/_myschema will ignore _ directories.
			if ( input.substring(0, 1) != '_' ) {
				// add inputs
				var this_config = require('./inputs/'+input+'/config.json');
				
				logDebug('input to load: ' + this_config['name']);
				//launcher.launch(input, 'restart');						// use restart, will stop/start.
				inputs[this_config['name']] = require('./inputs/'+input+'/index.js');
				inputs[this_config['name']]._load();
				inputs[this_config['name']]['config'] = require('./inputs/'+input+'/config.json');
				//inputs.push(input);
			}
		});
		logDebug('inputs loaded');
		cb();
	});
	
	
	// load inputs as daemons.
	/* fs.readdir(config['path'] + '/src/inputs', function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(input){
			logDebug('inputs: ' + input);
			// if /src/inputs/_myschema will ignore _ directories.
			if ( input.substring(0, 1) != '_' ) {
				// add inputs
				logDebug('input to load: ' + input);
				launcher.launch(input, 'restart');						// use restart, will stop/start.
				inputs.push(input);
			}
		});
		logDebug('inputs loaded');
		cb();
	}); */	
}


function loadIndexes(cb) { 
	logDebug('loading indexes');
	mysql_client.query("SELECT * FROM data, indexes WHERE data.id=indexes.data_id", function(err, results, fields) {
		if (err) { throw err; }
	
		var index_names = [];
		for ( var row in results ) {
			var index_name = results[row]['schema'] + '_' + results[row]['data_id'] + '_' + results[row]['version'];
			logDebug('index_name: ' + index_name);
			var port_string = '"' + results[row]['port'] + '"' + '';
			indexes[port_string] = index_name;
			index_names[row] = index_name;
		}
		cb();
	});
}


function lastSphinxID(indexes, cb2) {
	
	logDebug('get lastSphinxID');

	//console.log("attr (" + name + ") id " + obj[name]);  

	// mysql client to connect to sphinx's mysql proxy (does not need mysql server).
	mysql_sphinx_client = mysql.createConnection({								// (global)
		host: 		config['sphinx_host'],
		port: 		config['sphinx_port'],
		user: 		config['sphinx_user'],
		password: 	config['sphinx_pass'],
		debug:		false
	});	
		

	var makeIndexArr = [];
	var makeIndexPortArr = [];
	var i = 0;
	var z = 0

	for (var name in indexes) { 
		//logDebug('name: ' + name);
		//logDebug('name: ' + indexes[name]);
		makeIndexArr[i] = indexes[name];
		makeIndexPortArr[i] = name;
		i++;
	}
	
	//dump(indexes);
	// if no indexes return empty.
	if ( makeIndexArr.length == 0 ) {
		logDebug('indexes empty');
		cb2();	// done loading.
		return;
	}	
	
	mysql_sphinx_client.connect(function(err) {
		// connected! (unless `err` is set)
		if (err) { 
			logDebug('error: mysql_sphinx_client did not connect');
			cb2();	// done loading.
			return;

		}
	});		
/* 	
	
	try {	
		mysql_sphinx_client.connect();	
	} catch(e) {
		logDebug('indexes empty');
		cb2();	// done loading.
		return;
	}	
	 */
	// test connection may need repeat connection attempts.
	var c = 0; var connectOK = false;
	for ( c = 0; c < 9; c++ ) {
		mysql_sphinx_client.query("SHOW TABLES", 
		 function(err, results, fields) {
			if (err) {
				// if ECONNREFUSED retry!
				console.log('sphinx MySQL proxy error attempt#: ' + c + ' Err: ' + err.message);
				if ( c === 9 ) {
					console.log('ERR! final attempt to connect to sphinx MySQL proxy - Error: ' + err.message);
					throw err;
				}
				connectOK = true;
			}
		});
		if ( connectOK === true ) {
			// ok continue.
			break;
		}
	}
	
	

	nimble.each(makeIndexArr, function (index_name) {
		//logDebug('sphinx_index_name: ' + index_name);
		
		mysql_sphinx_client.query("SELECT id FROM " + index_name + " ORDER BY id DESC LIMIT 1", 
		 function(err, results, fields) {
			//if (err) { throw err; }
				if (err) {
				
					// if ECONNREFUSED retry!
				
					console.log('sphinx MySQL proxy Error: ' + err.message);
					throw err;
					//cb();
					//return;	
				}			
			
			if ( results[0] ) {

				var j = 0;
				for (var name2 in indexes) { 
					makeIndexArr[j] = indexes[name2];
					//logDebug("attr (" + name2 + ") id " + indexes[name2]);  
					if ( index_name == indexes[name2] ) {
						var port_num = parseInt(name2.substring(1, name2.lenght));
						var lastid = 0;
						try {
							lastid = results[0]['id'];
						} catch(e) {
							lastid = 0;
						}
						
						//logDebug("port: " + port_num + " name: " + indexes[name2] + " lastid: " + lastid);
						indexes[name2] = {"port": port_num, "name": indexes[name2], "lastid": lastid};
						z++;
					}
					//logDebug('makeIndexArr.length: ' + makeIndexArr.length + ' j: ' + j + ' z: ' + z);
					j++;
					
				}
				
				if ( makeIndexArr.length === z ) {
					mysql_sphinx_client.end();
					cb2();	// done loading.
				}
			
			} else {	
				// index does not have any rows in sphinx so last id = 0.
				//logDebug('z: ' + z);
				//logDebug('makeIndexPortArr: ' + makeIndexPortArr[1]);
				var port_num = parseInt(makeIndexPortArr[z].substring(1, makeIndexPortArr[z].lenght));
				indexes[makeIndexPortArr[z]] = {"port": port_num, "name": index_name, "lastid": 0};	
				z++;
				
				if ( makeIndexArr.length === z ) {
					mysql_sphinx_client.end();
					cb2();	// done loading.
				}
				
			} // end if has result.
		});
	
		//z++;
		
	});
	
}


// converts string to 64 bit or 32 bit integer.
function md5ToInt(string, bits, cb) {
	
	var intVal = -1;
	
	// if nada return as -1.
	
	//console.log('string: ' + string);
	
	if ( string == '' ) {
		console.log('ERR, md5ToInt: string NADA');
		cb(intVal);	
	}

	// character and nunber map to integer.
	var charmap = {"a":0,"b":1,"c":2,"d":3,"e":4,"f":5,"g":6,"h":7,"i":8,"j":9,"k":0,"l":1,"m":2,"n":3,"o":4,"p":5,"q":6,"r":7,"s":8,"t":9,"u":0,"v":1,"w":2,"x":3,"y":4,"z":5,"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9};
	
	var md5 = crypto.createHash('md5').update(string).digest("hex");
	//md5 = '073911bef1beb05bf55685fbe138741e';	// 64 bit = 173911145114105150
	//md5 = '973911bef1beb05bf55685fbe138741e';	// 64 bit = 973911145114105200

	var str64 = '';
	
	var bit = '';
	var x = 0;
	
	//g.logDebug("md5: " + md5 + " len: " + md5.length);
	
	for ( x = 0; x < md5.length; x++ ) {
		bit = eval('"' + md5.substring(x, x + 1) + '"' + '');
		if ( x === 0 && bit === "0" ) {
			bit = "1";				// if first char of md5 is 0 change to 1.
		}
		//g.logDebug("bit: " + bit + " charmap: " + charmap[bit]);
		str64 = str64 + charmap[bit];
	}
	
	// trim to 18 chars (can be 19 chars if under 922...) fit in 64 bits OR 9 chars for 32 bits.
	var toTrim = 18;				// 64 bits
	if ( bits === 32 ) {
		toTrim = 9;					// 32 bits
	}
	str64 = str64.substring(0, toTrim);
	str64 = eval(str64 + '');
	
	//g.logDebug('str64: ' + str64);
	
	intVal = parseInt(str64);		// convert string number to integer number.
	cb(intVal);						// return as integer.
	
}
function md5ToIntSync(string, bits) {
	
	var intVal = -1;
	
	// if nada return as -1.
	
	//console.log('string: ' + string);
	
	if ( string == '' ) {
		console.log('ERR, md5ToInt: string NADA');
		return false;
	}

	// character and nunber map to integer.
	var charmap = {"a":0,"b":1,"c":2,"d":3,"e":4,"f":5,"g":6,"h":7,"i":8,"j":9,"k":0,"l":1,"m":2,"n":3,"o":4,"p":5,"q":6,"r":7,"s":8,"t":9,"u":0,"v":1,"w":2,"x":3,"y":4,"z":5,"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9};
	
	var md5 = crypto.createHash('md5').update(string).digest("hex");
	//md5 = '073911bef1beb05bf55685fbe138741e';	// 64 bit = 173911145114105150
	//md5 = '973911bef1beb05bf55685fbe138741e';	// 64 bit = 973911145114105200

	var str64 = '';
	
	var bit = '';
	var x = 0;
	
	//g.logDebug("md5: " + md5 + " len: " + md5.length);
	
	for ( x = 0; x < md5.length; x++ ) {
		bit = eval('"' + md5.substring(x, x + 1) + '"' + '');
		if ( x === 0 && bit === "0" ) {
			bit = "1";				// if first char of md5 is 0 change to 1.
		}
		//g.logDebug("bit: " + bit + " charmap: " + charmap[bit]);
		str64 = str64 + charmap[bit];
	}
	
	// trim to 18 chars (can be 19 chars if under 922...) fit in 64 bits OR 9 chars for 32 bits.
	var toTrim = 18;				// 64 bits
	if ( bits === 32 ) {
		toTrim = 9;					// 32 bits
	}
	str64 = str64.substring(0, toTrim);
	str64 = eval(str64 + '');
	
	//g.logDebug('str64: ' + str64);
	
	intVal = parseInt(str64);		// convert string number to integer number.
	return intVal;					// return as integer.
	
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
exports.log 				= log;
exports.logDebug 			= logDebug;
exports.dump 				= dump;
exports.startup 			= startup;
exports.dbSelect 			= dbSelect;
exports.lastSphinxID		= lastSphinxID;
exports.md5ToInt			= md5ToInt;
exports.md5ToIntSync		= md5ToIntSync;
exports.radians_decode		= radians_decode;
exports.radians_encode		= radians_encode;
exports.timer				= timer;
