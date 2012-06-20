//
// Kurunt Default Report
//
// Default streaming analytics report.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var report_config 						= require("./config.json");								// config settings for this schema.
var nimble 								= require('../../nimble.min.js');	
var util 								= require('util');

var repeat_pulse 						= null;
var repeat_table 						= null;
var repeat_chart 						= null;

var interval_pulse						= 1000;													// miliseconds for querying.
var interval_table						= 1000;												// miliseconds for querying.
var interval_chart						= 10000;												// miliseconds for querying.

var sendingInterval 					= false;


// this function always gets called when kurunt first starts up (must always have _load function, called by local function.js).
function _load(g) {
	g.log('*Loading ' + report_config['title'] + ' Report.');
}


// when client views report (must have _connect function, called by routes).
function _connect(config, g, lg, sio, req) {

	g.logDebug('_connect ' + report_config['title'] + ' Report.');


	//update_table(config, g, lg, sio, req.sessionID);
	
	
	
	// NOTE! make sure you only call setInterval once, as if browser page reloads stacks up multiple intervals.
	if ( sendingInterval == false ) {
		_sendInterval(config, g, lg, sio, req.sessionID);
	}

}


function _sendInterval(config, g, lg, sio, sessionid) {

	// pulse chart.
	repeat_pulse = setInterval(function() {
		//lg.logDebug('DUMP> ' + util.inspect(lg.clients, true, 99, true));
		sendingInterval = true;
		for ( var client in lg.clients ) {
			if ( lg.clients[client]['report'] != 'default' ) { continue; }
			if ( lg.clients[client]['data'] == undefined ) { continue; }
			if ( lg.clients[client]['data']['table'] == undefined ) { continue; }
			
			if ( lg.clients[client]['data']['count'] == undefined ) {
				lg.clients[client]['data']['count'] = 0;
				lg.logDebug('count undefined');
			}
			
			//update_table_only(config, g, lg, sio, sessionid);
			
			if ( lg.clients[client]['data']['fresh'] == true ) {
				lg.clients[client]['count'] = 0;
				lg.logDebug('count fresh');	
				//if ( lg.clients[client]['data']['chart'] == 'table' ) {
					//update_table(config, g, lg, sio, sessionid);
				//}
				
				lg.clients[client]['data']['fresh'] = false;
			}
			
			// form sql, if attributes and values set, add to sql call.
			var sql = 'SELECT id FROM ' + lg.clients[client]['data']['table'] + ' LIMIT 1';
			
			if ( lg.clients[client]['data']['value'] != '' ) {
				//WHERE+user_mentions+=+493442514165505340+ORDER+BY+id+DESC+LIMIT+0%2C+10+OPTION+max_matches+%3D+10000
				sql = 'SELECT id FROM ' + lg.clients[client]['data']['table'] + ' WHERE ' + lg.clients[client]['data']['attribute'] + ' = ' + lg.clients[client]['data']['value'] + ' LIMIT 1';
			} else {
			
			}			
			
			
			lg.logDebug('query data -->');
 			query_pulse(config, g, lg, sql, client, sio, function() {});		
			
			// NOTE! what happens if the query takes longer than the interval (eg 1 second)?
		}
	}, interval_pulse);	
	
	
	// table.
	


	// run interval for regular updating.
	repeat_table = setInterval(function() {
		//lg.logDebug('DUMP> ' + util.inspect(lg.clients, true, 99, true));
		sendingInterval = true;
		for ( var client in lg.clients ) {
			if ( lg.clients[client]['report'] != 'default' ) { continue; }
			if ( lg.clients[client]['data'] == undefined ) { continue; }
			if ( lg.clients[client]['data']['table'] == undefined ) { continue; }
			
			// form sql, if attributes and values set, add to sql call.
			var sql = 'SELECT * FROM ' + lg.clients[client]['data']['table'] + ' ORDER BY id DESC LIMIT 10';
			
			if ( lg.clients[client]['data']['value'] != '' ) {
				//WHERE+user_mentions+=+493442514165505340+ORDER+BY+id+DESC+LIMIT+0%2C+10+OPTION+max_matches+%3D+10000
				sql = 'SELECT * FROM ' + lg.clients[client]['data']['table'] + ' WHERE ' + lg.clients[client]['data']['attribute'] + ' = ' + lg.clients[client]['data']['value'] + ' ORDER BY id DESC LIMIT 10';
			} else if ( lg.clients[client]['data']['attribute'] != '' ) {
				sql = 'SELECT * FROM ' + lg.clients[client]['data']['table'] + ' WHERE ' + lg.clients[client]['data']['attribute'] + ' != 0 GROUP BY ' + lg.clients[client]['data']['attribute'] + ' ORDER BY @count DESC LIMIT 0, 10';
			} else {
			
			}
			
			
			lg.logDebug('query data -->');
 			query_table(config, g, lg, sql, lg.clients[client]['data']['table'], client, sio, function() {});	
			
			//by_time_segment('minutes', config, g, lg, sql, lg.clients[client]['data']['table'], client, sio, function() {});
			
		}
	}, interval_table);	
	

	// chart.
	//...
}


var update_table_on_request_intval = null;
function update_table(config, g, lg, sio, sessionid) {
	lg.logDebug('update_table -->');
	
	
// run upfront, then followed by interval for updating.
	update_table_on_request_intval = setInterval(function() {
		//lg.logDebug('DUMP> ' + util.inspect(lg.clients, true, 99, true));
		for ( var client in lg.clients ) {
			if ( lg.clients[client]['report'] != 'default' ) { continue; }
			if ( lg.clients[client]['data'] == undefined ) { continue; }
			if ( lg.clients[client]['data']['table'] == undefined ) { continue; }
			
			clearInterval(update_table_on_request_intval);		// thanks, client socket connected, got him/her, can now stop repeat checking.
			
			// form sql, if attributes and values set, add to sql call.
			var sql = 'SELECT * FROM ' + lg.clients[client]['data']['table'] + ' ORDER BY id DESC LIMIT 10';
			
			lg.logDebug('query table data first -->');
 			query_table(config, g, lg, sql, lg.clients[client]['data']['table'], client, sio, function() {});	
		}
	}, 100);	

	
}



function update_table_only(config, g, lg, sio, sessionid) {
	lg.logDebug('update_table only -->');
	
	

	//lg.logDebug('DUMP> ' + util.inspect(lg.clients, true, 99, true));
		for ( var client in lg.clients ) {
			if ( lg.clients[client]['report'] != 'default' ) { continue; }
			if ( lg.clients[client]['data'] == undefined ) { continue; }
			if ( lg.clients[client]['data']['table'] == undefined ) { continue; }
			
			clearInterval(update_table_on_request_intval);		// thanks, client socket connected, got him/her, can now stop repeat checking.
			
			// form sql, if attributes and values set, add to sql call.
			var sql = 'SELECT * FROM ' + lg.clients[client]['data']['table'] + ' ORDER BY id DESC LIMIT 10';
			
			lg.logDebug('query table data first -->');
 			query_table(config, g, lg, sql, lg.clients[client]['data']['table'], client, sio, function() {});	
		}
	

	
}


function query_pulse(config, g, lg, sql, client, sio, cb) {
/* 
	// if no indexes return empty.
	if ( g.indexes.length == 0 ) {
		lg.logDebug('indexes empty');
		cb();	// done loading.
		return;
	}
	 */
	// mysql client to connect to sphinx's mysql proxy (does not need mysql server).
	var mysql_sphinx_client = g.mysql.createConnection({
		host: 		config['sphinx_host'],
		port: 		config['sphinx_port'],
		user: 		config['sphinx_user'],
		password: 	config['sphinx_pass'],
		debug:		false
	});	

	nimble.series([
		function (callback) {
			lg.logDebug('sphinx sql: ' + sql);
			mysql_sphinx_client.query(sql, function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error: ' + err.message);
					throw err; 
				}
			})
			.on('end', function() {
				callback();														// local callback.
			});	
		},	
		function (callback) {
			// show meta gets th total values for above sql.
			mysql_sphinx_client.query('SHOW META', function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error: ' + err.message);
					throw err; 	
				}
				
				var time_taken = 0;
				for ( var row2 in results ) {
					if ( results[row2]['Variable_name'] == 'time' ) {
						time_taken = results[row2]['Value'];
					}
				}
				
				for ( var row in results ) {
					lg.logDebug('Variable_name: ' + results[row]['Variable_name'] + ' Value: ' + results[row]['Value']);
					var value = results[row]['Value']
					if ( results[row]['Variable_name'] == 'total_found' ) {
					
						if ( lg.clients[client] == undefined ) { mysql_sphinx_client.end(); cb(); return; }
						if ( lg.clients[client]['data'] == undefined ) { mysql_sphinx_client.end(); cb(); return; }
					
						var running_tot = parseInt(value) - lg.clients[client]['data']['count'];

						if ( lg.clients[client]['data']['count'] == 0 ) {
							lg.logDebug('SET count 0');
							running_tot = 0;
						}
						
						lg.clients[client]['data']['count'] = parseInt(value);
						mysql_sphinx_client.end();

						lg.logDebug('time_taken: ' + time_taken);
						lg.logDebug('sending pulse data for sock: ' + lg.clients[client]['socketid'] + ' api_key: ' + lg.clients[client]['api_key'] + ' -->');
						// send data to client socket -->
						sio.sockets.socket(lg.clients[client]['socketid']).emit('response', { chart: 'pulse', api_key: lg.clients[client]['api_key'], table: lg.clients[client]['data']['table'], attribute: lg.clients[client]['data']['attribute'], value: lg.clients[client]['data']['value'], real_value: lg.clients[client]['data']['real_value'], timesegment: 'min', timestamp: new Date().getTime(), count: running_tot, total: lg.clients[client]['data']['count'] });
						cb();				// done, callback to _sendInterval
						return;
					}
					
					//values['matrix'][results[row]['Variable_name']] = value;
				}

			})
			.on('end', function() {
				return;
			});	
		}
	]);	
	
}



function query_table(config, g, lg, sql, table, client, sio, cb) {
/* 
	// if no indexes return empty.
	if ( g.indexes.length == 0 ) {
		lg.logDebug('indexes empty');
		cb();	// done loading.
		return;
	}
 */

	var values = [];		// all variables returned to jade.
	var tables = [];		// index tables avaiable.
	var matrix = {};			// sql returned table as json/arr.
	
	values['sql'] = sql;
	values['table'] = table;


	// mysql client to connect to sphinx's mysql proxy (does not need mysql server).
	var mysql_sphinx_client = g.mysql.createConnection({
		host: 		config['sphinx_host'],
		port: 		config['sphinx_port'],
		user: 		config['sphinx_user'],
		password: 	config['sphinx_pass'],
		debug:		false
	});	

	mysql_sphinx_client.on('error', function(err) {
		console.log('SHIT: ' + err.code); // 'ER_BAD_DB_ERROR'
	});

	

	mysql_sphinx_client.connect(function(err) {
		if (err) { 
			lg.logDebug('indexes empty');
			cb();	// done loading.
			return;
		}
	});		
	

	
	
		
	nimble.series([
		function (callback) {
			lg.logDebug('sphinx sql: ' + sql);
			mysql_sphinx_client.query(sql, function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error: ' + err.message);
					throw err; 
				}
				var x = 0;
				
				//g.dump(fields);
				var cols = [];
				for ( var col in fields ) {
					//cols.push(col);
					cols.push(fields[col]['orgName']);
				}
				//g.logDebug('cols:');
				//g.dump(cols);
				
				//g.logDebug('RES: ');
				//g.dump(results);				

				// matrix of sql results as array and json, for query.
				//matrix['sql'] = sql;
				matrix['table'] = {};
				matrix['found'] = results.length;

				for ( var row in results ) {

					// item 1 (0):
					matrix['table'][row] = {};	// row = 0, 1, 2 etc
					
					//console.log( 'x: ' + x + ' len: ' +  results.length );
					//g.logDebug('row: ' + row + ' field: ' + results[row]['attr_values']);
					
					if ( results[row]['attr_values'] != undefined ) {
					
					var attr_values = JSON.parse( results[row]['attr_values'] );
					var id_str = '"' + results[row]['id'] + '"';
					//g.dump(attr_values);
					
					} else {
						var attr_values = [];
					}
					
					var row_arr = [];
					row_arr[x] = [];
					
					var this_row = {};
					
					for ( var c in cols ) {
						//g.logDebug('c: ' + c);
						
						var field = cols[c];

						var value = results[row][cols[c]];
						var real_value = attr_values[results[row][cols[c]]];
						if ( real_value == undefined ) {
							real_value = value;
						}
						
						//g.logDebug('field: ' + field + ' value: ' + value + ' real_value: ' + real_value);
						
						if ( field != 'attr_values' ) {
							// row field and values.
							matrix['table'][row][field] = {};
							var field_objs = {};
							field_objs.value = value;
							field_objs.real_value = real_value;
							matrix['table'][row][field] = field_objs;								
						}

					}
					x++;	
				}
			})
			.on('end', function() {
				//mysql_sphinx_client.end();
				values['matrix'] = matrix;
				callback();														// local callback.
			});	
		},	
		function (callback) {
			// show meta gets th total values for above sql.
			mysql_sphinx_client.query('SHOW META', function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error: ' + err.message);
					throw err; 	
				}
				
				var time_taken = 0;
				for ( var row2 in results ) {
					if ( results[row2]['Variable_name'] == 'time' ) {
						time_taken = results[row2]['Value'];
					}
				}
				
				for ( var row in results ) {
					lg.logDebug('Variable_name: ' + results[row]['Variable_name'] + ' Value: ' + results[row]['Value']);
					var value = results[row]['Value']
					if ( results[row]['Variable_name'] == 'total_found' ) {
					
						if ( lg.clients[client] == undefined ) { mysql_sphinx_client.end(); cb(); return; }
						if ( lg.clients[client]['data'] == undefined ) { mysql_sphinx_client.end(); cb(); return; }
					
	
						mysql_sphinx_client.end();

						lg.logDebug('time_taken: ' + time_taken);
						lg.logDebug('sending table data for sock: ' + lg.clients[client]['socketid'] + ' api_key: ' + lg.clients[client]['api_key'] + ' -->');
						// send data to client socket -->
						sio.sockets.socket(lg.clients[client]['socketid']).emit('response', { chart: 'table', api_key: lg.clients[client]['api_key'], table: lg.clients[client]['data']['table'], attribute: lg.clients[client]['data']['attribute'], value: lg.clients[client]['data']['value'], real_value: lg.clients[client]['data']['real_value'], timesegment: 'min', total: parseInt(value), matrix: strencode(matrix) });
						cb();				// done, callback to _sendInterval
						return;
					}
					
					//values['matrix'][results[row]['Variable_name']] = value;
				}

			})
			.on('end', function() {
				return;
			});	
		}
	]);	
	
}


function by_time_segment(time_segment, config, g, lg, sql, table, client, sio, cb) {

	var segments = [];	// array of each time segment with totals for timeline graph.
	var finished = false;
	var time_taken = 0;

	// default.
	time_segment = 'minutes';	// hours, days.
	
	// minutes = last 10 minutes of 60 * 10 second segments.

	// mysql client to connect to sphinx's mysql proxy (does not need mysql server).
	var mysql_sphinx_client = g.mysql.createConnection({
		host: 		config['sphinx_host'],
		port: 		config['sphinx_port'],
		user: 		config['sphinx_user'],
		password: 	config['sphinx_pass'],
		debug:		false
	});	

	// time notes, in milliseconds:
	// 1 second = 1000
	// 10 seconds = 10000
	// 1 minute = 60000
	// 1 hour = 3600000
	
	
	var x = 0;	// time segment ticks, eg: 60 for minutes.
	var ticks = 60;
	var tick = 10; // 10 seconds
	

	
	// loop through each tick.
	
	lg.logDebug('going to loop timeseg');
	
	for ( x = 0; x < ticks; x++ ) {
		_query_time_segment(config, g, lg, table, mysql_sphinx_client, segments, time_taken, x, ticks, tick, function () {
			// got
		});
	}
	
	
	
/* 	
	
							lg.logDebug('time_taken: ' + time_taken);
						lg.logDebug('sending pulse data for sock: ' + lg.clients[client]['socketid'] + ' api_key: ' + lg.clients[client]['api_key'] + ' -->');
						// send data to client socket -->
						sio.sockets.socket(lg.clients[client]['socketid']).emit('response', { chart: 'pulse', api_key: lg.clients[client]['api_key'], table: lg.clients[client]['data']['table'], attribute: lg.clients[client]['data']['attribute'], value: lg.clients[client]['data']['value'], real_value: lg.clients[client]['data']['real_value'], timesegment: 'min', timestamp: new Date().getTime(), count: running_tot, total: lg.clients[client]['data']['count'] });
						cb();				// done, callback to _sendInterval
						return;
 */
}

var time_to = 0;
var time_from = 0;
function _query_time_segment(config, g, lg, table, mysql_sphinx_client2, segments, time_taken, x, ticks, tick, cb2) {
		
			// mysql client to connect to sphinx's mysql proxy (does not need mysql server).
	var mysql_sphinx_client = g.mysql.createConnection({
		host: 		config['sphinx_host'],
		port: 		config['sphinx_port'],
		user: 		config['sphinx_user'],
		password: 	config['sphinx_pass'],
		debug:		false
	});	
		
		nimble.series([
			function (callback) {
			
				// work out each time segment tick to appead to sql.
				if ( x != 0 ) {
					time_to -= tick;
					time_from -= tick;
					
					
					//
					
					sql = 'SELECT id, IDIV(ms, 1000) as unixtime FROM ' + table + ' WHERE unixtime BETWEEN ' + time_from + ' AND ' + time_to + ' LIMIT 1 OPTION max_matches = 1';
					
				} else {
					//time_to = 9000000000;		// the newest time, infinity future
					time_to = Math.round(new Date().getTime() / 1000);
					time_from = time_to;
					time_from -= tick;
					
					//SELECT *, IDIV(ms, 1000) as unixtime FROM twitter_9_1 WHERE unixtime >= 1339812482 ORDER BY id DESC LIMIT 0, 11 OPTION max_matches = 10000
					
					sql = 'SELECT id, IDIV(ms, 1000) as unixtime  FROM ' + table + ' WHERE unixtime > ' + time_from + ' LIMIT 1 OPTION max_matches = 1';
					
				}
				
			
				lg.logDebug('x: ' + x + ' sphinx sql: ' + sql);
				mysql_sphinx_client.query(sql, function(err, results, fields) {
					//if (err) { throw err; }
					if (err) {
						console.log('DB Error: x: ' + x + ' err: ' + err.message);
						throw err; 
					}
					callback();														// local callback.
				})
				.on('end', function() {
					
				});	
			},	
			function (callback) {
				// show meta gets th total values for above sql.
				mysql_sphinx_client.query('SHOW META', function(err, results, fields) {
					//if (err) { throw err; }
					if (err) {
						console.log('DB Error:  x: ' + x + ' err: ' + err.message);
						throw err; 	
					}
					for ( var row in results ) {
						if ( results[row]['Variable_name'] == 'time' ) {
							time_taken += results[row]['Value'];
							lg.logDebug('time_taken: ' + results[row]['Value']);
						}
						if ( results[row]['Variable_name'] == 'total_found' ) {
							segments[x] = results[row]['Value'];
							lg.logDebug('x: ' + x + ' total_found: ' + results[row]['Value']);
							mysql_sphinx_client.end();
							callback();	
						}
					}
				})
				.on('end', function() {
					//callback();	
				});	
			},
			function (callback) {
				if ( x === ticks ) {
					//finished = true;
					
					lg.logDebug('fin segments: ');
					
					lg.logDebug('DUMP> ' + util.inspect(segments, true, 99, true));
					// call back.
					cb2(segments);
					return;
					
				}
			}
		]);	
}


function strencode( data ) {
	return unescape( encodeURIComponent( JSON.stringify( data ) ) );
}

// expose functions.
exports._load 							= _load;
exports._connect 						= _connect;