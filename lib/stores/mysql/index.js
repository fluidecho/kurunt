//
// Kurunt MySQL Store
//
// MySQL Store
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config = require("./config.json");		// local config.

var log 				= function(txt) { if ( config['debug'] === 'benchmarking' || config['debug'] === 'debug' ) { console.log(txt); } };

var version 		= 0.2;


var connection 	= undefined;
var db 					= 'kurunt';		// set database name.

try {

	var mysql = require('mysql');
	// NOTE: set your own mysql credentials...
	connection = mysql.createConnection({
		host     : 'localhost',
		user     : 'root',
		password : 'pass',
	});

	connection.connect(function(err) {
		if (err) throw err;
		log('mysql@store> db connected.');
	});

	connection.on('error', function(err) {
		log('mysql@store> error code: ' + err.code + ' error message: ' + err.message);
	});

} catch(e) {
	log('mysql@store> To use the MySQL store you\'ll need to install the mysql module: npm install felixge/node-mysql');
}


// must export 'store' module.
module.exports.store = function (message, report, callback) {

  // See: http://docs.kurunt.com/stores/mysql/

  log('mysql@stores, MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
	
  // use try catch so can skip over invalid messages.
  try {
  
  	if ( connection === undefined ) {
  		return callback( false );
  	}
  
  	// NOTE: you can write your mysql store anyway you prefer! 
  	// You could also apply batch inserting to make this faster.

		var table = message.worker.object.toString();		// the messages worker, so can use its schema to define table structure.

		var sql_table = 'CREATE TABLE IF NOT EXISTS `' + db + '`.`' + table + '` ('

		var sql_insert = 'INSERT INTO `' + db + '`.`' + table + '` ';
		var sql_insert_fields = '(';
		var sql_insert_values = '(';

		var hasdata = false;
		// extract data from 'mysql' schema.
		for ( var s in message.stores ) {
			console.log('s: ' + s + ' value: ' + message.stores[s]);
			for ( var st in message.stores[s] ) { 
				console.log('st: ' + st + ' value: ' + message.stores[s][st]);
				if ( st === 'mysql' ) {

					console.log('mysql s> ' + s + require('util').inspect(message.stores[s]['mysql'], true, 99, true));
				
					for ( var v in message.stores[s][st]['schema'] ) {

						hasdata = true;
					
						console.log('mysql v> ' + s + require('util').inspect(message.stores[s][st]['schema'][v], true, 99, true));
					
						sql_table += '`' + message.stores[s][st]['schema'][v]['name'] + '` ' + message.stores[s][st]['schema'][v]['type'] + ',';
					
						sql_insert_fields += message.stores[s][st]['schema'][v]['name'] + ',';
						if ( message.stores[s][st]['schema'][v]['value']  === undefined ) {
							sql_insert_values += 'null,';
						} else {
							sql_insert_values += '\'' + message.stores[s][st]['schema'][v]['value'] + '\',';
						}
					
					}
					
				}
			}
		}

		sql_table = sql_table.substring(0, sql_table.length - 1);		// trim off trailing ',' 
		sql_insert_fields = sql_insert_fields.substring(0, sql_insert_fields.length - 1);		// trim off trailing ','
		sql_insert_values = sql_insert_values.substring(0, sql_insert_values.length - 1);		// trim off trailing ','
		
		sql_table += ')';		// end sql.
		console.log('mysql sql_table> ' + sql_table);
		
		sql_insert += sql_insert_fields + ') VALUES ' + sql_insert_values + ')';
		console.log('mysql sql_insert> ' + sql_insert);

		if ( hasdata === false ) {		
			return callback( false );
		}

		connection.query('CREATE DATABASE IF NOT EXISTS `' + db + '`', function(err) {
			if (err) throw err;
			//if (err) return callback( true );
			
			connection.query(sql_table, function(err) {
				if (err) throw err;
				//if (err) return callback( true );
			
				connection.query(sql_insert, function(err, rows, fields) {
					if (err) throw err;
					//if (err) return callback( true );

					//console.log('The solution is: ', rows[0].solution);
				});
				
			});
			
		});

		// return true for grabage collection.
    return callback( true );
  
  } catch(e) {
  	throw e;
    return callback( false );
  }

};

