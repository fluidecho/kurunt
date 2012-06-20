//
// Kurunt E.T.L
//
// Extract Transform Load messages: extract from inputs, transform with schemas, load into indexes.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config 				= require("../config.json");						// this is your config settings.
var g 					= require("./functions.js");						// global functions and variables.
var nimble 				= require('./nimble.min.js');	


// db-mysql binding client (load synchronously so will finish connecting).
var db_mysql_sphinx_client;
var db_mysql = require('/usr/local/lib/node_modules/db-mysql');				// /usr/local/lib/node_modules/db-mysql/build
new db_mysql.Database({
	hostname			: config['sphinx_host'],
	user				: config['sphinx_user'],
	password			: config['sphinx_pass'],
	database			: '',
	port				: config['sphinx_port'],
	reconnect			: true
}).connect(({async:false}), function(error) {
    if (error) {
        return console.log("CONNECTION ERROR to sphinx: " + error);
		throw err;
    }
	db_mysql_sphinx_client = this;
	g.logDebug("connected to sphinx db via db-mysql.");
});


// zeromq.
var zmq 				= require('/usr/local/lib/node_modules/zmq');
var sock 				= [];												// socket as array for each open port (port int + 1).	


// exposes function.
exports._load			= _load;											
exports._unload			= _unload;
exports.open			= open;
exports.close			= close;
exports.sock_message	= sock_message;										// exposes function to open() function internally.	


var sql = '';																// SQL statement for inserts into sphinx.

// messages rate, use this to know if should batch inserts into sphinx.
var mps 				= 0;												// message per second.
var mps_line 			= 0;												// lines so far.
var messages_batched 	= 0;												// total messages batched for insert (within var sql).
var batching_status 	= false;											// current batching status, updated every second.

var mp_proc 			= 0;

var t = g.timer();
var timetaken 			= 0;


// every second check batching rate.
setInterval(
	function() {
		mps = mps_line;
		//g.logDebug('mps: ' + mps);
		//console.log('mps: ' + mps);	
		//return;								// TEST.
		mps_line = 0;		// restart
		if ( mps === 0 ) {
			batching_status = false;
			sphinxMysqlInsert('', '', function () {
				// cleans up nay remaining messages in sql yet to be inserted.
			});
			return;
		}
		if ( mps > config['message_batching_rate'] ) {
			//g.logDebug('START Batching! mps: ' + mps);
			batching_status = true;
			return;
		}
		batching_status = false;
	}
, 1000);


// required "_load()" function.
function _load() {

	// for each open port set post int as string to be array object.
	//g.logDebug('data: ');
	//g.dump(g.data);

	// opens all ports found in g.data.
	
	var p = 0;
	for ( p in g.data ) {
		//g.logDebug('open port: ' + p);
		
		// only with status = open.
		if ( g.data[p]['status'] != 'open' ) {
			continue;
		}
		
		var etl_port = g.data[p]['port'] + 1; 									// etl_port is always open port + 1. dont need config['message_port'] anymore!!!
		//g.logDebug('etl_port: ' + etl_port);
		
		sock[p]	= zmq.socket('pull');
		sock[p].connect('tcp://' + config['message_host'] + ':' + etl_port);
		g.log('*ETL connected and listening to tcp://' + config['message_host'] + ':' + etl_port + ' for input: ' + g.data[p]['input'] + ' & schema: ' + g.data[p]['schema'] + '.');	
		
		sock[p].on('message', function(buffer) {
			sock_message(buffer);
		});
		
	}

} // end _load() function.


// closes all open etl 'sock' connection to zmq, note does not close inputs.
function _unload() {
	var s = 0;
	for ( s in sock ) {
		this.close(s);
	}
}


// open a single port (port = input (g.data & sock) port).
function open(port) {
	
	// etl_port is always open port + 1.
	if ( typeof (port) == 'string' ) {
		// make sure port int.
		var etl_port = port.replace(/"/g, "");		
		etl_port = parseInt(etl_port) + 1;
	} else {
		var etl_port = port + 1;
		port = '"' + port + '"';
	}	
	
	//g.logDebug('etl_port: ' + etl_port);
	//g.logDebug('port: ' + port);
		
	sock[port]	= zmq.socket('pull');
	sock[port].connect('tcp://' + config['message_host'] + ':' + etl_port);
	g.log('*ETL connected and listening to tcp://' + config['message_host'] + ':' + etl_port + ' for input: ' + g.data[port]['input'] + ' & schema: ' + g.data[port]['schema'] + '.');	
		
	sock[port].on('message', function(buffer) {
		sock_message(buffer);
	});
	
}


// close a single specified etl open port (port = input (g.data & sock) port), note does not close input.
// HUM! not sure zmq actually closes properly, so investigate solve in next version!? (As stop gap security limit zmq connections from inputs to localhost in config['message_host']).
function close(port) {
	// port = the open 'input' port, convert + 1 to = the etl port.
	
	if ( typeof (port) == 'string' ) {
		// make sure port int.
		var etl_port = port.replace(/"/g, "");		
		etl_port = parseInt(etl_port) + 1;
	} else {
		var etl_port = port + 1;
		port = '"' + port + '"';
	}
	
	g.logDebug('ETL close port: ' + port);
	
	//sock[port].close();		// NOTE: seems to be a problem with this, investigate for next version.
	sock.splice(port, 1);

	g.log('*ETL disconnected from tcp://' + config['message_host'] + ':' + etl_port + '.');	
}


// recieve messages.
var trailing_message = '';													// if last message is without \n then marry with next incomming.
function sock_message(message) {
	//g.log('work...');
		
	if ( mp_proc == 0 ) {
		t.start();
	}
		
	var message = JSON.parse(message); 										// convert message into JSON, message["message"] = the client's actual message.
		
	if ( trailing_message != '' ) {
		message["message"] = trailing_message + message["message"];
		trailing_message = '';												// reset.
	}
		
	//g.dump(message);
		
	if ( message["message"].substring(message["message"].length - 2, 2) != '\n' ) {
		var posL = message["message"].lastIndexOf('\n');
		trailing_message = message["message"].substring(posL);
		if ( trailing_message.trim() != '' ) {
			//g.logDebug('MESSAGE UNMARRIED!!!!');
			//g.logDebug('posL:' + posL + ' totMessLen: ' + message["message"].length);
			//g.logDebug('trailing_message:' + trailing_message);
			message["message"] = message["message"].substring(0, posL);		// remove trailing unmarried message.
		} else {
			trailing_message = '';											// reset.
		}
	}

		
	// it's posiable that you'll recieve multiple "batched" messages within one send, so split by return and loop.
	var l = 0;
	var liness = [];
		
	liness = message["message"].split(/\n/g);								// standard syslog messages use LF delimiter (\n), but for more support could use: /\r\n|\r|\n/g
	var lines = [];
	// make sure no blank messages.
	for (k in liness) {
		if (liness[k]) { 
			// if part message marry with next sock[0].on 
			//g.logDebug('MESS LINE:-'+liness[k]);
			//if ( liness[k].indexOf('ssageENDEND') > 0 ) {
			//	g.logDebug('END OF MESS RECIEVED!');
			//	continue;
			//}
			lines.push(liness[k]);		
		}
	}
	var totalLines = lines.length;
	//g.log('totalLines: ' + totalLines);
	var i = 0;
		
	//g.log('lines: ' + lines.length);
	for ( l in lines ) {
		i++;

		//g.logDebug('line: ' + lines[l]);
		message["message"] = lines[l].trim();
			
		// start time for this message.
		var now = new Date();
		var jsonDate = now.toJSON();
		var epoch = now.getTime();
		message["message_received"] 	= jsonDate;
		message["process_start"] 		= epoch;
			
		processMessage(message, function(result) {
			// got cleaned result else false.
			if ( result != false ) {
					
				//insert (index) in sphinx
				insertSphinx(message, function(result) {
					if ( result != false ) {
						//can now insert into mongo (if want/need too).
						//g.logDebug('MESSAGE RES, NEXT MESSAGE >');
						mps_line++;		// must be here not in sphinx insert.
					}
				});
					
			}
		});		
			
	}		
		
}


// now's you're chance to process/clean/filter/regex the message before passing.
function processMessage(message, callback) {

	message["message"] = message["message"].toString(config['message_encoding']);	
	//g.logDebug('MESSAGE: ' + message["message"]);
		
	//g.dump(message);
		
	//g.logDebug('port: ' + message["port"]);
	//g.logDebug('message: ' + message["message"]);
	//g.logDebug('typeIs: ' + typeof message["port"]);
	//g.logDebug('typeIs: ' + typeof message["message"]);
		
	var schema = '';
	var index = '';
		
	try {
			
		var port_string = '"' + message["port"] + '"' + '';
		//g.logDebug('port_string: ' + port_string);
			
		// message schema.
		schema = g.data[port_string]['schema'];
		if ( schema === '' ) {
			return false;
		}
			
		// message index.
		//g.dump(g.indexes);
		index = g.indexes[port_string]['name'];
		if ( index === '' ) {
			return false;
		}
			
	} catch(e) {
		g.logDebug('Message NOT valid port! err: ' + e.message);
		return false;
	}

	//g.logDebug('index: ' + index);
	message["index"] = index;
		
	//g.logDebug('schema: ' + schema);
	message = g.schemas[schema].process(message);
		
	//g.logDebug('Message Now Schemed');
	//g.dump(message);
		
	//g.logDebug('Message Now JSON');
	//var messageJSON = JSON.stringify(message); 
	//g.logDebug(messageJSON);
		
		
	//g.logDebug('name: ' + message_schemed['name'] + ' number: ' + message_schemed['number']);
		
	// now apply schema to message.
	//var i; var x = 0;
	//for ( i in message_schemed ) {
	//	g.logDebug('x: ' + x + ' obj: ' + i + ' val: ' + message_schemed[i]);
	//	x++;
	//}
		
		
	callback(message);		// ok returns message.
} // end processMessage.


// insert (index) the message in sphinx
function insertSphinx(message, cb3) {
	//g.logDebug('do, insert sphinx');
		
	nimble.series([
		function (callback) {
			
			// Assign int IDs to attributes for sphinx.
			// for each attribute in message.
			var a = 0;	var z = 1;	var bits = 64;
			for ( a in message['schema']['attributes'] ) {
				//g.logDebug(schema_config['sphinx_schema'][i]['attr_type'] + ' = ' + schema_config['sphinx_schema'][i]['attr_name']);
				//g.logDebug('attr: type: ' + message['schema']['attributes'][a]['type'] + ' value: ' + message['schema']['attributes'][a]['value']);
				
				if ( message['schema']['attributes'][a]['value'] == '' || message['schema']['attributes'][a]['value'] == undefined ) {
					message['schema']['attributes'][a]['value'] = '';
					message['schema']['attributes'][a]['id'] = 0;		// nada value.
				} else {
					if ( typeof (message['schema']['attributes'][a]['value']) == 'string' ) {
						if ( message['schema']['attributes'][a]['type'] == 'rt_attr_bigint' ) {
							bits = 64;
						}
						if ( message['schema']['attributes'][a]['type'] == 'rt_attr_uint' ) {
							bits = 32;
						}
						// convert string to int for sphinx id.
						g.md5ToInt(message['schema']['attributes'][a]['value'], bits, function (intID) {
							//g.logDebug('convert string to int for sphinx id: ' + intID);
							//g.logDebug('intID: ' + intID + ' len: ' + intID.toString().length + ' type: ' + typeof intID);
							// asign id to attribute.
							message['schema']['attributes'][a]['id'] = intID;
						});
					} else {
						// if floating point
						if ( message['schema']['attributes'][a]['type'] == 'rt_attr_float' ) {
							message['schema']['attributes'][a]['id'] = g.radians_encode(message['schema']['attributes'][a]['value']);
						} else {
							// value is already a number so set real value as id.
							message['schema']['attributes'][a]['id'] = message['schema']['attributes'][a]['value'];
						}
					}
				}
				
				//g.logDebug('attr len: ' + message['schema']['attributes'].length + ' z: ' + z);
				if ( message['schema']['attributes'].length == z ) {
					callback();	// done.
				}
				z++;
			} // end for each attr.
				
		},
		function (callback) {
			
			// Generate SQL.
			//if ( batching_status === true ) {
				//g.logDebug('batch: ' + batching_status);
			//}		
				
			// id
			var port_string = '"' + message["port"] + '"' + '';
			var lastid = parseInt(g.indexes[port_string]['lastid']);
			var nextid = lastid + 1;			// need to +1 for index lastid
			var id = nextid;
			g.indexes[port_string]['lastid'] = nextid;		
			
			// if message is set with own id, use that.
			if ( typeof(message['id']) != 'undefined' ) {
				id = message['id'];
				if ( typeof (message['id']) == 'string' ) {
					id = g.md5ToIntSync(message['id'], config['bits']);
				}
			}
			//g.dump(message);
			
			var sql_fields 			= "id, foo, ms, ";													// foo is sphinx required (blank) string for rt indexes, ms = milliseconds as bigint on INSERT
			var sql_values 			= "'" + id + "', '', '" + new Date().getTime() + "', ";				// was foo = 'bar',
			var sql_attr_values		= "";																// EG: ...', '{973911145114105200:Mozilla/4.08 [en] (Win98; I ;Nav),336440543172367700:GET /apache_pb.gif}')
			var attr_val			= "";
			var attr_val_encoded	= "";
				
			// for each attribute in message.
			var a = 0;	var z = 1;	var bits = 64;
			for ( a in message['schema']['attributes'] ) {
				//console.log(schema_config['sphinx_schema'][i]['attr_type'] + ' = ' + schema_config['sphinx_schema'][i]['attr_name']);
					
				//attr_val_encoded = mysql_sphinx_client.escape(message['schema']['attributes'][a]['value']);	// hum! puts '' around each value, anoying cause dont want for attr_values.
				attr_val = message['schema']['attributes'][a]['value'];
					
				//g.logDebug('attr: type: ' + message['schema']['attributes'][a]['type'] + ' valueEscape: ' + attr_val_encoded);
					
				sql_fields 				= sql_fields + message['schema']['attributes'][a]['name'] + ',';	
				sql_values 				= sql_values + "'" + message['schema']['attributes'][a]['id'] + "',";	
					
				// set real values map if id != value as sphinx string field and json/array compatible with JS.
				if ( message['schema']['attributes'][a]['id'] != message['schema']['attributes'][a]['value'] && typeof (message['schema']['attributes'][a]['value']) == 'string' && message['schema']['attributes'][a]['value'] != '' ) {
					attr_val = attr_val.replace(/"/g, "&#34;");				// i use " for json (client side) so delineate to ISO Latin-1.
					attr_val = attr_val.replace(/'/g, "&#39;");				// ' will generate sql insert error so delineate to ISO Latin-1.
					//attr_val = attr_val.replace(/:/g, "&#58;");			// i use : for json (client side) so delineate to ISO Latin-1.
					sql_attr_values		= sql_attr_values + "\"" + message['schema']['attributes'][a]['id'] + "\":\"" + attr_val + "\",";		// attr_val wraped in " so can be turned into json/js array.
				}
					
				//g.logDebug('attr len: ' + message['schema']['attributes'].length + ' z: ' + z);
				if ( message['schema']['attributes'].length == z ) {
						
					sql_fields 			= sql_fields.substring(0, sql_fields.length - 1);
					sql_values 			= sql_values.substring(0, sql_values.length - 1);
					sql_attr_values 	= sql_attr_values.substring(0, sql_attr_values.length - 1);
						
					sql_attr_values		= "'{" + sql_attr_values + "}'";
					//g.logDebug('sql_attr_values: ' + sql_attr_values);
						
					// check if batching inserts.
					if ( sql != '' ) {
						sql = sql + ",(" + sql_values + "," + sql_attr_values + ")";
					} else {
						sql = "INSERT INTO " + message["index"] + " (" + sql_fields + ",attr_values) VALUES (" + sql_values + "," + sql_attr_values + ")";
					}
					//g.logDebug('sql: ' + sql);

					// finished time for this message.
					var now = new Date();
					var epoch = now.getTime();
					var processing_time = epoch - message["process_start"];
					//g.logDebug('epoch: ' + epoch + ' process_start: ' + message["process_start"]);
					message["process_time_ms"] = processing_time;

					//g.logDebug("FIN MESS dump: ");
					//g.dump(message);						
						
					callback();		// done.
						
				}
				z++;
			} // end for each attr.
			
		},			
		function (callback) {
			// finally send to sphinx.
			//g.logDebug('insert into sphinx via mysql proxy.');
			sphinxMysqlInsert('', message, function (cb) {
				callback();	
			});
		},
		function (callback) {
			cb3();
		}
	]);	

} // end insertSphinx.


function sphinxMysqlInsert(sqlloc, message, cb) {
	try {

		if ( sql == '' ) {
			return true;													// nothing left to insert.
		}	
		
		if ( batching_status === true ) {
			// start batching up inserts into config["message_batching_rate"] eg 1000 to insert a time.
			//g.logDebug('messages_batched: ' + messages_batched + ' mps: ' + mps + ' message_batching_rate: ' + config['message_batching_rate']);
			if ( messages_batched < (config['message_batching_rate'] - 1) ) {
				//console.log('mps not yet, get next');
				messages_batched++;
				cb();														// ok next message please.
				return true;												// come back with more batched messages.
			} else {
				mp_proc = mp_proc + messages_batched;						// processing rate.
				messages_batched = 0;										// reset.
				sqlloc = sql;						
				sql = '';													// reset.
			}
			// ok have reached total or not batching - insert.
		} else {
			messages_batched = 0;											// reset.
			sqlloc = sql;						
			sql = '';														// reset.			
		}
			
		//g.logDebug('sqlloc: ' + sqlloc);

		//
		// using db-mysql (https://github.com/mariano/node-db-mysql).
		// has continuous inserting, at around 2000 mps.
		//
		// options settings:
		// async: seems to work a bit better (and faster) if false.
		// cast: converts to Javascript native type, seems slightly faster if false.
		var options = ({
			async: 		false,
			cast:		false
		}); 

		// if sphinx client diconnected (ie searchd restarted) reconnect client to sphinx (mysql proxy).
		if ( db_mysql_sphinx_client == undefined ) {
			new db_mysql.Database({
				hostname			: config['sphinx_host'],
				user				: config['sphinx_user'],
				password			: config['sphinx_pass'],
				database			: '',
				port				: config['sphinx_port'],
				reconnect			: true
			}).connect(({async:false}), function(error) {
				if (error) {
					return console.log("CONNECTION ERROR to sphinx2: " + error);
					throw err;
				}
				db_mysql_sphinx_client = this;
				g.logDebug("reconnected to sphinx db via db-mysql.");
			});		
		}
		
		db_mysql_sphinx_client.query(sqlloc).execute(function(error, rows, cols) {
			if (error) {
				//ERROR 1064 (42000): duplicate id '1'
				if ( error.indexOf('duplicate id') != -1 ) {
					// duplicate id err is intended event for pixel schema, so don't throw err.
					if ( message['schema']['name'] != 'pixel' ) {
						return console.log('ERR, DB: ' + error + ' sql: ' + sqlloc);
						throw err;
					}
				} else {
					return console.log('ERR, DB: ' + error + ' sql: ' + sqlloc);
					throw err;
				}
			}
			//g.logDebug('INSERT-ed into sphinx.');
		
			mp_proc++;
			if ( mp_proc >= config['message_batching_rate'] ) {
				t.stop();
				timetaken = t.getTime();
				var mps_res = mp_proc / timetaken;
				//console.log(timetaken + ', ' + mp_proc + ', ' + mps_res);		// to generate csv table results for debug.
				//console.log('timetaken: ' + timetaken);		
				//console.log('mps: (	' + mp_proc + ') '  + mps_res);	
				mp_proc = 0;
				timetaken = 0;
				t.start();
			}	
				
		}, options);
			
		cb();		// next message.
			 
		//
		// using db-mysql (https://github.com/mariano/node-db-mysql).
		// has fast batch inserts around 4000+ mps, but only inserts after message processing completed, this is a problem, maybe a bug, or my code?
		//
		/* g.mysql_sphinx_client.query(sqlloc, function(err, info) {
			//g.dump(info);
			if (err && err.number != mysql.ERROR_DB_CREATE_EXISTS) {
				console.log("ERR, DB: insert sphinx err, " + err + " sql error: " + sqlloc);
				throw err;
			}
			//g.logDebug('INSERT-ed into sphinx.');
			//g.logDebug('rows afected: ' + info.affectedRows);
		
			mp_proc++;
			if ( mp_proc >= config['message_batching_rate'] ) {
				t.stop();
				timetaken = t.getTime();
				var mps_res = mp_proc / timetaken;
				console.log(timetaken + ', ' + mp_proc + ', ' + mps_res);		// to generate csv table results for debug.
				//console.log('timetaken: ' + timetaken);		
				//console.log('mps: (	' + mp_proc + ') '  + mps_res);	
				mp_proc = 0;
				timetaken = 0;
				t.start();
			}				
			
		}); 
			
		cb();		// next message.
			*/

	} catch(err) {
		console.log("ERR: insert sphinx, " + err);
		throw err;
	}
}




// *******************************************************************
//	
// NOTES:	
//
// Sphinx RT indexes currently support the following attribute types:
// uint, bigint, float, timestamp, string
// 
// rt_attr_uint			= gid	
// rt_attr_bigint		= guid
// rt_attr_float		= gpa
// rt_attr_multi 		= my_tags
// rt_attr_multi_64 	= my_wide_tags
// rt_attr_timestamp	= ts_added
// rt_attr_string		= author
//
// NOTE: SphinxQL has a number of reserved words which CANNOT be used as schema attribute names (case insensitive)!
// Kurunt: also has a list of reserved words, including: KURUNT, REAL_VALUE, REPORT, FOO, ATTR_VALUES, ATTR_KEYS, MS, UNIXTIME, X, C
// Also note cannot use dahses - use undersocres _ instead!
// See for updated list: http://sphinxsearch.com/docs/current.html#sphinxql-reserved-keywords
// AND
// AS
// ASC
// AVG
// BEGIN
// BETWEEN
// BY
// CALL
// COLLATION
// COMMIT
// COUNT
// DELETE
// DESC
// DESCRIBE
// DISTINCT
// FALSE
// FROM
// GLOBAL
// GROUP
// ID
// IN
// INSERT
// INTO
// LIMIT
// MATCH
// MAX
// META
// MIN
// NOT
// NULL
// OPTION
// OR
// ORDER
// REPLACE
// ROLLBACK
// SELECT
// SET
// SHOW
// START
// STATUS
// SUM
// TABLES
// TRANSACTION
// TRUE
// UPDATE
// VALUES
// VARIABLES
// WARNINGS
// WEIGHT
// WHERE
// WITHIN
//
// *******************************************************************