//
// Kurunt Web Admin
//
// Web Admin
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var http 				= require("http");
var url 				= require("url");
var path 				= require("path");
var fs 					= require("fs");
var mime 				= require("mime");
var util 				= require("util");
var querystring = require('querystring');
var crypto 			= require('crypto');
var nimble			= require("nimble");
var sendData		= require(__dirname.toString().substring(0, __dirname.toString().length - 9) + "lib/testclient/./send.js");

var config 			= require('../.././config.json');
//var jstreams 		= require('../.././streams.json');


var httpconfig 	= require('../inputs/http/./config.json');		// need for getting http input port.
//var httpconfig = {};
//httpconfig['input_port'] = 5555;

// streams, will be set in kurunt tags, can be used when new/edit stream.
var streams = undefined;
var streamfile = __dirname.toString().substring(0, __dirname.toString().length - 9) + 'streams.json';


// get stream reports port.
var stream_report_config = require('../reports/stream/./config.json');
//console.log('stream_report_config: ' + stream_report_config['port']);


var last_input_port = Number(config['input_port_start']);		// the port number to start for each apikey using tcp or udp 





var processes = undefined;
module.exports.set_processes = function (xprocesses) {
	processes = xprocesses;
};




if ( config['admin_www'] === true ) {
	http.createServer(function(req, res) {
	 
		var uri = url.parse(req.url).pathname;
		//var filename = path.join(process.cwd(), uri);
		var filename = '';
		
		if ( uri === '/' ) {
			//filename = process.cwd() + '/lib/admin/index.html';
			filename = __dirname + '/index.html';
		} else {
			//filename = process.cwd() + '/lib/admin/' + uri;
			filename = __dirname + uri;
		}
		
		//console.log('index@admin> uri: ' + uri);
		//console.log('index@admin> filename: ' + filename);


		// --- static web server, return static requested file or 404 ------------------------------------
		fs.exists(filename, function(exists) {
		  
		  // if file not found, return 404!
		  if(!exists) {
		  	//console.log(pname + ' 404 file');
		    res.writeHead(404, {"Content-Type": "text/plain"});
		    res.write("404 Not Found\n");
		    res.end();
		    return;
		  }
	 
	 		// if called directory, allways return 'index.html' file!
			if (fs.statSync(filename).isDirectory()) filename += '/index.html';
	 		//console.log('index@admin> filename to read: ' + filename);
	 		
		  fs.readFile(filename, "binary", function(err, file) {
		    if(err) {        
		      res.writeHead(500, {"Content-Type": "text/plain"});
		      res.write(err + "\n");
		      res.end();
		      return;
		    }
	 
	 
	 			// kurunt tags ------------------------------------------------------
	 			// if is html file append any <kurunt-tag> tags.
	 			if ( filename.substring(filename.length - 5) === '.html' || filename.substring(filename.length - 4) === '.htm' ) {
					//console.log('webserver@admin, html file contents> ' + util.inspect(file, true, 99, true));
					
					// kurunt tags map to replace with:
					var tags = {};		// all tags are proceeded by 'kurunt-';
					
					// check if socket.io is installed as is required by stream report.
					try {
						var testio = require('socket.io');
						tags['report-address'] = 'http://' + config['host'] + ':' + stream_report_config['port'];		// okay has socket.io installed.
						testio = null;
					} catch(e) {
						// socket.io not installed.
						//console.log('need to install socket.io from stream report');
						tags['report-address-okay'] = 'http://' + config['host'] + ':' + stream_report_config['port'];
						tags['report-address'] = '/install-io.html';
					}
					
					tags['version'] = 0.2;
					tags['host'] = config['host'];

					// http input port.
					tags['http-port'] = httpconfig['input_port'];

					var hasStream = false;
					
					var workers = {};
					var stores = {};
					var inputs = {};
					
					var api_config = require('../stores/stream/./config.json');
					tags['stream-api-pass'] = api_config['stream_api_pass'];
					tags['stream-api-port'] = api_config['stream_api_port'];
					
					tags['directory'] = __dirname.toString().substring(0, __dirname.toString().length - 9);

					// using nimble module to control flow in series.
					nimble.series([
						// if new/edit save post form.
						function (callback) {
	
							// if new/edit stream form.
							if (req.method === 'POST') {

						 		var fmdata = "";
								req.on("data", function(chunk) {
									fmdata += chunk;
								});

								req.on("end", function() {
									//console.log("raw: " + fmdata);
									var postdata = querystring.parse(fmdata);
									//console.log('webserver@admin> postdata: ' + util.inspect(postdata, true, 99, true));
				
									if ( postdata.newStream === 'true' || postdata.editStream === 'true' ) {		// NOTE: is 'true' literal not js true!!!
										//console.log('create new stream!');
										var newstream = {};
					
										if ( postdata.newStream === 'true' ) {
											// NOTE: by default tcp issues port sequentially from 6001 and udp from 7001, http using random 16 char md5 hash.
											var apikey = undefined;
											if ( postdata.input === 'tcp' || postdata.input === 'udp' ) {
												last_input_port++;
												apikey = last_input_port;
											} else {
												// http or other input type
												apikey = crypto.createHash('md5').update(Math.random().toString()).digest("hex").toString().substring(0,16);
											}
										} else {
											
											var apikey = postdata.apikey.toString();
											if ( apikey.length != 16 ) {
												apikey = Number(apikey);		// is port number.
											}
									
										}
					
										newstream.apikey = apikey;
										newstream.input = { object: postdata.input, id: 0 };
										newstream.worker = postdata.worker;
										newstream.stores = [];
										if ( postdata.stores instanceof Array ) {
											for ( var str in postdata.stores ) {
												if ( postdata.stores[str] != '' ) {
													newstream.stores.push(postdata.stores[str]);
												}
											}
										} else {
											if ( postdata.stores != undefined ) {
												newstream.stores.push(postdata.stores.toString());
											}
										}
										newstream.reports = [];
										newstream.reports.push('stream');
										
										newstream.tags = [];
										var tagsary = [];
										tagsary = postdata.tags.split(',');	
										for ( var tg in tagsary ) {
											if ( tagsary[tg].trim() != '' ) {
												newstream.tags.push(tagsary[tg].trim());
											}
										}											
																				
										newstream.access_hosts = [];
										var accesshosts = [];
										accesshosts = postdata.accesshosts.split('\r\n');	
										for ( var ah in accesshosts ) {
											if ( accesshosts[ah].trim() != '' ) {
												newstream.access_hosts.push(accesshosts[ah].trim());
											}
										}	
																		
										newstream.status = postdata.status;

										if ( postdata.editStream === 'true' ) {
											for ( var sz in streams['streams'] ) {
												//console.log('edit sz: ' + streams['streams'][sz]['apikey']);
												if ( apikey === streams['streams'][sz]['apikey'] ) {
													//console.log('delete this streams and replace with edited from json');
													streams['streams'].splice(sz, 1);
												}
											}
					
										}
										
										// if yet to be set.
										if ( streams === undefined ) {
											streams = {};
											streams['streams'] = [];		// set the array if undefined.
										}
										streams['streams'].push(newstream);
					
										//console.log('webserver@admin> streams: ' + util.inspect(streams, true, 99, true));

										fs.writeFile(streamfile, JSON.stringify(streams), function (err) {
											if (err) throw err;
											//console.log(streamfile + ' saved!');

											// sending message to input, newStream, editStream, deleteStream.
											for ( var p in processes ) {
												//console.log('P: ' + processes[p]['kurunt_object'] + ' - ' + processes[p]['kurunt_namespace']);
												//console.log('processes RUNNING> ' + util.inspect(processes[p], true, 99, true));
												if ( processes[p]['kurunt_object'] === 'input' ) {
													if ( postdata.editStream === 'true' ) {
														processes[p].send({ editStream: JSON.stringify(newstream) });		// edit.
													} else {
														processes[p].send({ newStream: JSON.stringify(newstream) });		// new.
													}
												}
											}
											
											callback();	
										});					
					
									}
									
									
									if ( postdata.sendData === 'true' ) {
										// send some test data into a stream.
										
									
										sendData.init(config, streams);
										sendData.send(postdata.apikey, function(msent) {
											console.log('msent to apikey: ' + postdata.apikey + ' message: ' + msent);
											tags['sent-message-apikey'] = postdata.apikey;
											if ( msent != undefined ) {
												tags['sent-message'] = msent;
											} else {
												tags['sent-message'] = 'failed';									
											}
											callback();
										});
										
									
									}
									
				
								});			
			
							} else {
								callback();
							}

						},		
						// if delete stream.
						function (callback) {
								
							if ( req.url.indexOf('streams.html?delete=') != -1 ) {
								var apikey = req.url.substring(req.url.indexOf('delete=') + 7);
								if ( apikey.length != 16 ) {
									apikey = Number(apikey);		// is port number.
								}
								//console.log('delete apikey: ' + apikey);
								//console.log('req.url: ' + req.url);
								
								for ( var str in streams['streams'] ) {
									if ( streams['streams'][str]['apikey'] === apikey ) {
										//console.log('delete this stream, str: ' + str);
										streams['streams'].splice(str, 1);
									}
								}
								//console.log('webserver@admin> streams: ' + util.inspect(streams, true, 99, true));
								fs.writeFile(streamfile, JSON.stringify(streams), function (err) {
									if (err) throw err;
									//console.log(streamfile + ' deleted!');
									
									for ( var p in processes ) {
										//console.log('P: ' + processes[p]['kurunt_object'] + ' - ' + processes[p]['kurunt_namespace']);
										//console.log('processes RUNNING> ' + util.inspect(processes[p], true, 99, true));
										if ( processes[p]['kurunt_object'] === 'input' ) {
											processes[p].send({ deleteStream: apikey });		// edit.
										}
									}	
										
									callback();
								});									
								
							} else {
								callback();
							}

						},		
						// workers.
						function (callback) {
								
							// look within directory /lib/workers/ to discover available workers.
							// load inputs nativly through node require.
							var wpath = __dirname.toString().substring(0, __dirname.toString().length - 5);
							//console.log('wpath: ' + wpath);
							fs.readdir(wpath+ 'workers/', function(err, dirs){
								if(err) throw err;
								dirs.forEach(function(worker){
									var stats = stats = fs.lstatSync(wpath + 'workers/' + worker);
									if (stats.isDirectory()) {
										// if /lib/workers/_myworker will ignore.
										if ( worker.substring(0, 1) != '_' ) {
											// add worker
											var this_worker = require('.././workers/'+worker+'/index.js');
											var this_config = this_worker.config;
											//console.log('worker to load: ' + this_config['name']);
											workers[this_config['name']] = {};
											workers[this_config['name']] = this_config;
										}
									}
								});
		
								// ALSO, TODO: look through ../node_modules/ directory for kurunt.js files within modules,
								// require('kurunt.js') or perhapse 'config.json' within to see if it's a 'worker' and load if is.
								// hence users can> npm install myworker
		
								// have to stringify twice for some reason.
								var wjson = JSON.stringify(workers);
								tags['workers'] = JSON.stringify(wjson);
		
								callback();		//
									
							});							

						},	
						// stores.
						function (callback) {
								
							// look within directory /lib/stores/ to discover available workers.
							// load inputs nativly through node require.
							var wpath = __dirname.toString().substring(0, __dirname.toString().length - 5);
							//console.log('wpath: ' + wpath);
							fs.readdir(wpath+ 'stores/', function(err, dirs){
								if(err) throw err;
								dirs.forEach(function(store){
									var stats = stats = fs.lstatSync(wpath + 'stores/' + store);
									if (stats.isDirectory()) {
										// if /lib/workers/_myworker will ignore.
										if ( store.substring(0, 1) != '_' ) {
											// add store
											var this_config = require('.././stores/'+store+'/config.json');
											//console.log('store to load: ' + this_config['name']);
											stores[this_config['name']] = {};
											stores[this_config['name']] = this_config;
										}
									}
								});

								// ALSO, TODO: look through ../node_modules/ directory for kurunt.js files within modules,
								// require('kurunt.js') or perhapse 'config.json' within to see if it's a 'worker' and load if is.
								// hence users can> npm install myworker

								// have to stringify twice for some reason.
								var sjson = JSON.stringify(stores);
								tags['stores'] = JSON.stringify(sjson);

								callback();		//

							});							

						},
						// inputs.
						function (callback) {

							// look within directory /lib/inputs/ to discover available inputs.
							// load inputs nativly through node require.
							var wpath = __dirname.toString().substring(0, __dirname.toString().length - 5);
							//console.log('wpath: ' + wpath);
							fs.readdir(wpath+ 'inputs/', function(err, dirs){
								if(err) throw err;
								dirs.forEach(function(input){
									var stats = stats = fs.lstatSync(wpath + 'inputs/' + input);
									if (stats.isDirectory()) {
										// if /lib/inputs/_myworker will ignore.
										if ( input.substring(0, 1) != '_' ) {
											// add input
											var this_config = require('.././inputs/'+input+'/config.json');
											//console.log('input to load: ' + this_config['name']);
											inputs[this_config['name']] = {};
											inputs[this_config['name']] = this_config;
										}
									}
								});

								// ALSO, TODO: look through ../node_modules/ directory for kurunt.js files within modules,
								// require('kurunt.js') or perhapse 'config.json' within to see if it's a 'worker' and load if is.
								// hence users can> npm install myworker

								// have to stringify twice for some reason.
								var ijson = JSON.stringify(inputs);
								tags['inputs'] = JSON.stringify(ijson);

								callback();		//

							});							

						},
						// streams.
						function (callback) {

				    	// cant just require(stream) because it's cached not refreshed, so readFile.
							fs.readFile(__dirname + '/../../streams.json', function (err, s) {
								if (err) throw err;
								try {
									var st = JSON.parse(s);
									for ( var sx in st['streams'] ) {
										//console.log('sx : ' + sx + ' sxs: ' + st['streams'][sx]['apikey']);
										// get last tcp port used so can issue new on POST.
										if ( st['streams'][sx]['input']['object'] === 'tcp' || st['streams'][sx]['input']['object'] === 'udp' ) {
											if ( Number(st['streams'][sx]['apikey']) > last_input_port ) {
												last_input_port = Number(st['streams'][sx]['apikey']);
											}
										} else {
										}
										hasStream = true;
									}
								} catch(e) {
									// stream.json file empty, so set new.
									streams = {};
									streams['streams'] = [];
								}
								if ( hasStream === true ) {
									tags['streams'] = JSON.stringify(s.toString());
									streams = JSON.parse(s.toString());
								}


				        callback();		// callback only after readFile has returned results.
							});

						},
						// kurunt tags.
						function (callback) {

							for ( var tag in tags ) {
								//console.log('tag: ' + tag + ' tags: ' + tags[tag]);
								var regex = new RegExp("<kurunt-"+tag+">", 'gm');		// gm sets replace all and over multi lines.
								file = file.replace(regex, tags[tag]);
							}
				      
				      callback();
				      
						},
						// webserver response.
						function (callback) {

							// redirect to new-stream.html if on page streams.html and no streams set.
							if ( hasStream === false && uri === '/streams.html' ) {
		    				res.writeHead(200, {"Content-Type": "text/html"});
		    				res.write('<html><head><meta http-equiv="Refresh" content="0; url=new-stream.html"><title>Kurunt</title></head><body></body></html>\n');
		    				res.end();
						    callback();
						    return;
							}


				 			// return file contents to client browser.
							res.writeHead(200, {
								"Content-Type": mime.lookup(filename),
								"X-report-address": 'http://' + config['host'] + ':' + stream_report_config['port']
							});
							res.write(file, "binary");
							res.end();

				      callback();

						}
					]);

						// end kurunt tags -----------------------------------------
						
				} else {
				
		 			// non HTML file, return file contents to client browser.
				  res.writeHead(200, {
				  	"Content-Type": mime.lookup(filename),
				  	"X-report-address": 'http://' + config['host'] + ':' + stream_report_config['port']
				  });
				  res.write(file, "binary");
				  res.end();
		  
		  	}
		  
		  });
		  
		  
		  
		});
		// --- end static web server ---------------------------------------------------------------------
	}).listen(parseInt(config['admin_www_port'], 10));
	console.log("Open your web browser to admin at => http://" + config['host'] + ":" + config['admin_www_port'] + "/\n");
} else {
	console.log("web admin not running.");
}

