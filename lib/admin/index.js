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
 

var config 			= require('../.././config.json');
var jstreams 		= require('../.././streams.json');


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
	 
		  fs.readFile(filename, "binary", function(err, file) {
		    if(err) {        
		      res.writeHead(500, {"Content-Type": "text/plain"});
		      res.write(err + "\n");
		      res.end();
		      return;
		    }
	 
		    res.writeHead(200, {"Content-Type": mime.lookup(filename)});
		    res.write(file, "binary");
		    res.end();
		  });
		});
		// --- end static web server ---------------------------------------------------------------------
	}).listen(parseInt(config['admin_www_port'], 10));
}
 
console.log("Static file server running at\n  => http://localhost:" + config['admin_www_port'] + "/\nCTRL + C to shutdown");
