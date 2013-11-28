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
		  if(!exists) {
		  	//console.log(pname + ' 404 file');
		    res.writeHead(404, {"Content-Type": "text/plain"});
		    res.write("404 Not Found\n");
		    res.end();
		    return;
		  }
	 
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
					console.log('webserver@admin, html file contents> ' + util.inspect(file, true, 99, true));
					
					// kurunt tags map to replace with:
					var tags = {};
					tags['report-address'] = 'http://' + config['host'] + ':' + stream_report_config['port'];
					//tags['version'] = 0.2;

					nimble.series([
						function (callback) {
				    	// cant just require(stream) because it's cached not refreshed, so readFile.
							fs.readFile(__dirname + '/../../streams.json', function (err, s) {
								if (err) throw err;

								tags['streams'] = JSON.stringify(s.toString());
	
				        console.log('one, streams: ' + tags['streams']);
				        callback();
							});
						},
						function (callback) {

							for ( var tag in tags ) {
								console.log('tag: ' + tag + ' tags: ' + tags[tag]);
								file = file.replace("<kurunt-"+tag+">", tags[tag]);
							}
				      
				      console.log('two');
				      callback();
				      
						},
						function (callback) {

				 			// return file contents to client browser.
							res.writeHead(200, {
								"Content-Type": mime.lookup(filename),
								"X-report-address": 'http://' + config['host'] + ':' + stream_report_config['port']
							});
							res.write(file, "binary");
							res.end();
				        
				      console.log('write file to client');
				      callback();

						}
					]);

						// end tags ------
						
				} else {
				
		 			// return file contents to client browser.
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
