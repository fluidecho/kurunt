//
// Kurunt www - Data Handler
//
// Web pages for managing Kurunt.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//


var config 				= require("../../config.json");							// kurunt: this is your config settings.  
//var g 					= require("../../src/functions.js");				// global functions and variables.
var launcher 			= require('../../src/launch.js');						// for launching daemons like node.js programs or sphinx (searchd).
var nimble 				= require('../../src/nimble.min.js');	
var mysql				= require('/usr/local/lib/node_modules/mysql');			// native node.js mysql client.
var url		 			= require('url');
var fs 					= require('fs');
//var etl 				= require("../../src/etl.js");

var mysql_client		= '';


function _request(req, g, etl, cb) {
	
	//g.dump(req);
	//g.logDebug('etl_request: ' + etl);
	//g.dump(etl);
	
	//g.logDebug('data: ');
	//g.dump(g.data);	
	
	var values = [];		// all variables returned to jade.	
	
	// mysql client to connect to kurunt mysql server.
	mysql_client = mysql.createConnection({	
		host: 		config['db_host'],
		port: 		config['db_port'],
		user: 		config['db_user'],
		password: 	config['db_pass'],
		database:	'kurunt',
		debug:		false
	});		
	
	
	var status = req.query["status"];
	//g.logDebug('status: ' + status);	
	values['status'] = status;	
	var deleteData = req.query["delete"];
	//g.logDebug('deleteData: ' + deleteData);	
	values['deleteData'] = deleteData;		
	var newData = req.query["new"];
	//g.logDebug('newData: ' + newData);	
	values['newData'] = newData;			
	var id = req.query["id"];
	//g.logDebug('id: ' + id);	
	values['id'] = id;	
	var port = parseInt(req.query["port"]);
	//g.logDebug('port: ' + port);	
	values['port'] = port;
	var port_string = '"' + port + '"' + '';
	var input = req.query["input"];
	//g.logDebug('input: ' + input);	
	values['input'] = input;		
	var schema = req.query["schema"];
	//g.logDebug('schema: ' + schema);	
	values['schema'] = schema;	

	nimble.series([
		function (callback) {
			// CHANGE DATA STATUS.
		
			// (if) update data status, open | closed.
			if ( status == undefined || id == undefined || port == undefined || input == undefined ) {
				callback();														// local callback.
				return;
			}
			if ( status != 'open' && status != 'closed' ) {
				status = 'closed';
			}
			// if refresh page with same status, skip.
			try {
				if ( g.data[port_string]['status'] == status ) {
					callback();														// local callback.
					return;	
				}
			} catch(e) {
				// g.data[port_string] may not be defined if was closed on startup, so can change status.
			}
			//console.log("SQL: " + "UPDATE data SET status =  '" + status + "' WHERE  id = '" + id + "'");
			mysql_client.query("UPDATE data SET status =  '" + status + "' WHERE  id = '" + id + "'", function(err, results, fields) {
				if (err) {
					console.log('DB Error: ' + err.message);
					cb(values);
					return;	
				}
				
				if ( status == 'open' ) {
					g.data[port_string] = {'id': id, 'input': input, 'schema': schema, 'port': port, 'status': 'open'};				
					g.inputs[input].open(port);
					etl.open(port);
				} else {
					g.inputs[input].close(port);
					//etl.close(port);
					//g.data.splice(port_string, 1);
					g.data[port_string]['status'] = 'closed';
				}

				//console.log('DO status UPDATE');
				//g.dump(etl);
				//etl.open(9770);
				//g.dump(g.inputs['diggi']);
				//g.inputs['diggi'].open(9111);
			})
			.on('end', function() {
				callback();														// local callback.
			});		
		},	
		function (callback) {
			// DELETE DATA.
			
			// (if) update data status, open | closed.
			if ( deleteData == undefined || deleteData != 'true' || id == undefined || schema == undefined || g.indexes[port_string] == undefined ) {
				callback();														// local callback.
				return;
			}

			g.logDebug('DELETE DATA: ' + id);
			
			mysql_client.query("DELETE FROM indexes WHERE  data_id = '" + id + "'", function(err, info) { });
			
			mysql_client.query("DELETE FROM data WHERE  id = '" + id + "'", function(err, info) {
				if (err) {
					console.log('DB Error: ' + err.message);
					cb(values);
					return;	
				}
				
				try {
					if ( g.data[port_string]['status'] == 'open' ) {
						g.inputs[input].close(port);
						//etl.close(port);
					}
				} catch(e) {
				}
				
				g.data.splice(port_string, 1);
				//g.indexes.splice(port_string, 1);	// hum, not deleteing for some reason?
				g.indexes[port_string]['status'] = 'deleted';
			
			})
			.on('end', function() {
			
				// To delete (carefull!) the sphinx index: searchd --stop , cd /var/sphinx/data/ , rm [shcema]_id_version.*
				try {
					// stop sphinx.
					launcher.run('searchd --stopwait', function (cb2) {
					
						try {
							// delete sphinx index files.
							// NOTE: asumes version 1, version may change in future kurunt releases.
							fs.unlinkSync(config['sphinx_index_path'] + '/' + schema + '_' + id + '_1.lock');	// first!
							fs.unlinkSync(config['sphinx_index_path'] + '/' + schema + '_' + id + '_1.ram');
							fs.unlinkSync(config['sphinx_index_path'] + '/' + schema + '_' + id + '_1.meta');
							fs.unlinkSync(config['sphinx_index_path'] + '/' + schema + '_' + id + '_1.kill');
						} catch(e) {
							// may not have ram, meta, kill files yet, so starts with lock.
						}
						
						// restart sphinx.
						launcher.run('searchd --config ' + config['path'] + '/src./sphinx_config.js', function (cb2) { 	
							callback();												// local callback.
						});	
					});	
				} catch(e) {
					throw e;
				}
				
			});		
		},
		function (callback) {
			// NEW DATA.
			
			if ( newData == undefined || newData != 'data' || schema == undefined || input == undefined ) {
				callback();															// local callback.
				return;
			}
			
			// load schema onNew function (if exists).
			if( typeof g.schemas[schema]._admin_onNew == 'function' ) {
				var onNew = g.schemas[schema]._admin_onNew(values);
				if ( values['_admin_onNew'] == -1 ) {
					cb(values);
					return;	
				}
			}	
			
			// asign a random unused port number.
			var port = _getPortNum(g);
			var port_string = '"' + port + '"';

			mysql_client.query("INSERT INTO data (`id`, `input`, `schema`, `port`, `status`) VALUES (NULL, '" + input + "', '" + schema + "', '" + port + "', 'open')", function(err, info) {
				if (err) {
					console.log('DB Error: ' + err.message);
					cb(values);
					return;	
				}
				
				//console.log('LAST ID: ' + info.insertId);
				// index version currently 1, maybe different in future kurunt releases.
				mysql_client.query("INSERT INTO indexes (`id`, `type`, `data_id`, `version`) VALUES (NULL, '" + g.schemas[schema]['config']['engine'] + "', '" + info.insertId + "', '1')", function(err, info) { 
					if (err) {
						console.log('DB Error: ' + err.message);
						cb(values);
						return;	
					}			
				});

			
				try {

					launcher.run('searchd --stopwait', function (cb2) {
						launcher.run('searchd --config ' + config['path'] + '/src./sphinx_config.js', function (cb2) { 	
							g.data[port_string] = {'id': info.insertId, 'input': input, 'schema': schema, 'port': port, 'status': 'open'};				
							var index_name = schema + '_' + info.insertId + '_' + 1;	// version = 1
							//g.logDebug('index_name: ' + index_name);
							g.indexes[port_string] = index_name;
							g.indexes[port_string] = {"port": port, "name": index_name, "lastid": 0};
							g.inputs[input].open(port);
							etl.open(port);
							
						});	
					});

				} catch(err) {
					console.log('YEP ERR');
				}
			})
			.on('end', function() {
				callback();														// local callback.
			});
			
			//INSERT INTO indexes (id,type,data_id,version) VALUES (NULL, 'sphinx', '8', '1')
			
			
		},			
		function (callback) {
			// GET EXISTING DATA.
			
			var new_data = req.query["data"];
			//g.logDebug('new_data: ' + new_data);	
			values['new_data'] = new_data;
			
			var parsedUrl = url.parse('http://'+config['host']);
			var etl_host = parsedUrl.hostname;
			values['etl_host'] = etl_host;

			var data = [];
	
			mysql_client.query("SELECT * FROM data", function(err, results, fields) {
				if (err) { throw err; }

				for ( var row in results ) {
					//logDebug('cb: ' + result[x]['schema']);
					//data.push(result[x]);
					var port_string = '"' + results[row]['port'] + '"' + '';
					data[port_string] = [];
					data[port_string]['row'] = results[row];	

					data[port_string]['input'] = [];
					
					//g.logDebug('input: ' + results[row]['input']);
					var input = results[row]['input'];
					//g.logDebug(g.inputs[results[row]['input']]['config']['protocol']);
					data[port_string]['input']['config'] = g.inputs[results[row]['input']]['config'];
				}
			})
			.on('end', function() {
				values['data'] = [];
				values['data'] = data;
				callback();														// local callback.
			});					
			
		},		
		function (callback) {
			//mysql_client.end();
			
			cb(values);															// callback.
			callback();	
		}
	]);	

}


function _getPortNum(g) {

	//g.dump(g.data);

	var port = Math.floor(Math.random() * (config['message_port_range_to'] - config['message_port_range_from'] + 1) + config['message_port_range_from']);
	
	var x = 0;
	for ( x = 0; x < 999; x++ ) {
		// port cannot be same as already used nor +1, nor -1 to take in ETL port too.
		if ( g.data['"' + port + '"'] != undefined || g.data['"' + parseInt(port - 1) + '"'] != undefined  || g.data['"' + parseInt(port + 1) + '"'] != undefined ) {
			//g.logDebug('port already in use, try another!');
			port = Math.floor(Math.random() * (config['message_port_range_to'] - config['message_port_range_from'] + 1) + config['message_port_range_from']);
		} else {
			// ok can use this port number.
			break;
		}
	}
	
	if ( x >= 999 ) {
		g.log('Have run out of available ports! Extend the config.json "message_port_range_to" port number.');
		throw err;
		return -1;
	}
	
	//g.logDebug('Assigned PORT: ' + port + ' x: ' + x);
	return port;

}

exports._request 		= _request;												// expose.