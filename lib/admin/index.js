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

var nimble			= require("nimble");

var config 			= require('../.././config.json');
//var jstreams 		= require('../.././streams.json');

// get stream reports port.
var stream_report_config = require('../reports/stream/./config.json');
console.log('stream_report_config: ' + stream_report_config['port']);

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
		
		console.log('index@admin> uri: ' + uri);
		console.log('index@admin> filename: ' + filename);
		
		// favicon.
		if ( uri === '/favicon.ico' ) {
			res.writeHead(200, {'Content-Type': 'image/x-icon'} );
			res.end();
			return;
		}	  

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
					tags['report-address'] = 'http://' + config['host'] + ':' + stream_report_config['port'];
					tags['version'] = 0.2;
					tags['host'] = config['host'];

					var hasStream = false;
					
					var workers = {};
					
					var api_config = require('../stores/stream/./config.json');
					tags['stream-api-pass'] = api_config['stream_api_pass'];
					tags['stream-api-port'] = api_config['stream_api_port'];

					// using nimble module to control flow in series.
					nimble.series([
						// workers.
						function (callback) {
								
							// look within directory /lib/workers/ to discover available workers.
							// load inputs nativly through node require.
							var wpath = __dirname.toString().substring(0, __dirname.toString().length - 5);
							console.log('wpath: ' + wpath);
							fs.readdir(wpath+ 'workers/', function(err, dirs){
								if(err) throw err;
								dirs.forEach(function(worker){
									var stats = stats = fs.lstatSync(wpath + 'workers/' + worker);
									if (stats.isDirectory()) {
										// if /lib/workers/_myworker will ignore.
										if ( worker.substring(0, 1) != '_' ) {
											// add worker
											var this_config = require('.././workers/'+worker+'/config.json');
											console.log('worker to load: ' + this_config['name']);
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
						// streams.
						function (callback) {

				    	// cant just require(stream) because it's cached not refreshed, so readFile.
							fs.readFile(__dirname + '/../../streams.json', function (err, s) {
								if (err) throw err;
								
								var st = JSON.parse(s);
								for ( var sx in st['streams'] ) {
									console.log('sx : ' + sx + ' sxs: ' + st['streams'][sx]['apikey']);
									hasStream = true;
								}								
		
								if ( hasStream === true ) {
									tags['streams'] = JSON.stringify(s.toString());
								}		
								
	
				        callback();		// callback only after readFile has returned results.
							});
				      
						},
						// kurunt tags.
						function (callback) {

							for ( var tag in tags ) {
								console.log('tag: ' + tag + ' tags: ' + tags[tag]);
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
}
 
console.log("Static file server running at\n  => http://localhost:" + config['admin_www_port'] + "/\nCTRL + C to shutdown");
