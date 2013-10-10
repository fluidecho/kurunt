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
var jdata 			= require('../.././data.json');



http.createServer(function(request, response) {
 
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);
  
  console.log('uri: ' + uri);
  
	// favicon.
	if ( uri === '/favicon.ico' ) {
		response.writeHead(200, {'Content-Type': 'image/x-icon'} );
		response.end();
		return;
	}	  
  
  // data.
  if ( uri === '/data.json' ) {
  	console.log('MAKing data.json');
      response.writeHead(200, {"Content-Type": "application/json"});
      response.write(JSON.stringify(jdata));
      response.end();  
  	return;
  }
  
  // --- static web server, return static requested file or 404 ------------------------------------
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
 
	if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
 
      response.writeHead(200, {"Content-Type": mime.lookup(filename)});
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(config['admin_www_port'], 10));
 
console.log("Static file server running at\n  => http://localhost:" + config['admin_www_port'] + "/\nCTRL + C to shutdown");
