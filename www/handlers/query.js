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


function _request(req, cb) {
	
	//g.dump(req);
	//g.logDebug('get tables');
	
/*
	for ( var header in req.headers ) {
		g.logDebug('header: ' + header + ' - ' + req.headers[header]);
	}
 	var data = '';
	req.on('data', function(chunk) {
		data += chunk;
	});
	req.on('end', function() {
		g.logDebug('data: ' + data);
    });
*/


		
	// mysql client to connect to sphinx's mysql proxy (does not need mysql server).
	var mysql_sphinx_client = g.mysql.createConnection({									// (global)
		host: 		config['sphinx_host'],
		port: 		config['sphinx_port'],
		user: 		config['sphinx_user'],
		password: 	config['sphinx_pass'],
		debug:		false
	});	

	
	
	var values = [];		// all variables returned to jade.
	var tables = [];		// index tables avaiable.
	var matrix = {};			// sql returned table as json/arr.
	
	var sql = req.query["sql"];
	//g.logDebug('sql: ' + sql);	
	values['sql'] = sql;
/*  	
	var limit = req.query["limit"];
	g.logDebug('limit: ' + limit);
	values['limit'] = limit;	
	values['limit_prev'] = 0;
	 */
	var table = req.query["table"];
	//g.logDebug('table: ' + table);
	values['table'] = table;		
	
	//g.dump(g.indexes);
	
	nimble.series([
		function (callback) {
			mysql_sphinx_client.query("SHOW TABLES", function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error1: ' + err.message);
					//mysql_sphinx_client.end();
					cb(values);
					return;	
				}
				
				var x = 0;
				for ( var row in results ) {
					x++;
					//console.log( 'x: ' + x + ' len: ' +  results.length );
					//g.log('table: ' + results[row]['Index']);
					for ( var index in g.indexes ) {
						if ( g.indexes[index]['name'] == results[row]['Index'] && g.indexes[index]['status'] != 'deleted' ) {
							tables.push(results[row]['Index']);			
						}
					}
				}
			})
			.on('end', function() {
				values['tables'] = tables;
				callback();														// local callback.
			});		
		},
		function (callback) {
			if ( sql == undefined ) { 
				mysql_sphinx_client.end();
				cb(values);
				return;	
			}
			mysql_sphinx_client.query(sql, function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error: ' + err.message);
					mysql_sphinx_client.end();
					values['error'] = err.message;
					cb(values);	
					return;	
				}
				var x = 0;
				
				//g.dump(fields);
				var cols = [];
				for ( var col in fields ) {
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
						
						//g.logDebug('c: ' + c + 'field: ' + field + ' value: ' + value + ' real_value: ' + real_value);
						
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
			mysql_sphinx_client.query('SHOW META', function(err, results, fields) {
				//if (err) { throw err; }
				if (err) {
					console.log('DB Error: ' + err.message);
					mysql_sphinx_client.end();
					cb(values);
					return;	
				}
				
				for ( var row in results ) {
					//g.logDebug('Variable_name: ' + results[row]['Variable_name'] + ' Value: ' + results[row]['Value']);
					var value = results[row]['Value']
					if ( results[row]['Variable_name'] == 'total_found' ) {
						value = parseInt(value);
					}
					
					values['matrix'][results[row]['Variable_name']] = value;
				}

	 
				// pageiteration
				var sql_nolimit = sql.substring(0, sql.toLowerCase().indexOf("limit"));
				
				var sql_options = sql.toLowerCase().indexOf("option");
				if ( sql_options > 0 ) {
					sql_options = ' ' + sql.substring(sql_options);
				} else {
					sql_options = '';
				}
				
				var limit_from = 0;
				var limit_to = 0;
				var limit_pos = sql.toLowerCase().indexOf("limit");
				//console.log('limit_pos: ' + limit_pos);
				var limit_coma_pos = sql.indexOf(",", limit_pos);
				//console.log('limit_coma_pos: ' + limit_coma_pos);
				if ( limit_coma_pos == -1 ) {
					limit_coma_pos = sql.length;
				}
				if ( limit_pos == -1  ) {
					var limit_from = 0;
					var limit_to = 10;
				} else {
					var limit_from = parseInt(sql.substring(limit_pos + 5, limit_coma_pos));

					var limit_to = parseInt(sql.substring(limit_coma_pos + 1));
					if ( isNaN(limit_to) ) {
						limit_to = 10;
					}
				}
				//console.log('limit_from: ' + limit_from + ' limit_to: ' + limit_to);
				matrix['sql_first'] =  sql_nolimit + 'LIMIT 0, ' + limit_to + sql_options;
				var limit_from_next = limit_from;
				if ( limit_from_next >= (parseInt(matrix['total_found']) - limit_to) ) {
					limit_from_next = parseInt(matrix['total_found']) - limit_to;
				} else {
					limit_from_next = (limit_from + limit_to);
				}
				matrix['sql_next'] =  sql_nolimit + 'LIMIT ' + limit_from_next + ', ' + limit_to + sql_options;
				var limit_from_prev = (limit_from - limit_to);
				if ( limit_from_prev < 0 ) {
					limit_from_prev = 0;
				}
				matrix['sql_prev'] =  sql_nolimit + 'LIMIT ' + limit_from_prev + ', ' + limit_to + sql_options;
				matrix['sql_last'] =  sql_nolimit + 'LIMIT ' + (parseInt(matrix['total_found']) - limit_to) + ', ' + limit_to + sql_options;				
				
				matrix['limit_from'] = limit_from;
				matrix['limit_to'] = limit_to;
				
			})
			.on('end', function() {
				mysql_sphinx_client.end();
				//values['matrix'] = matrix;
				callback();														// local callback.
			});	
		},		
		function (callback) {
			/* 
			// pagetation to table.
			// min pt # 10. 
			values['pagetation'] = '';
			var b = matrix['found'];
			var t = matrix['total_found'];
			//page
			
			// ok
			if ( b < 9 ) {
				b = 10;
			}
			
			// b = 10, t = 30
			var x = 0;
			
			for ( x = b; x < t; x + b ) {

			}
			
			 */
			
			callback();	
		},		
		function (callback) {
			cb(values);															// callback.
			callback();	
		}		
	]);			
	
}




exports._request 		= _request;												// expose.