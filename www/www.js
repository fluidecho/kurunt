#!/usr/bin/env node
//
// Kurunt WWW
//
// WWW application for Kurunt.
// Version: 0.1
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2012 Mark W. B. Ashcroft.
// Copyright (c) 2012 Kurunt.
//

 
var nimble 					= require('./nimble.min.js');	
var express 				= require('/usr/local/lib/node_modules/express');			// using [-g] lib.
var io 						= require('/usr/local/lib/node_modules/socket.io');			// using [-g] lib.
var routes					= require('./routes');
var fs 						= require('fs');
var lg						= require('./functions.js');								// global functions and variables (www locally).					
var etl						= ''; //will need to load if self.
var util 					= require('util');

/* 
try {
    // check if src files exists.
    var src = fs.lstatSync('../config.json');
    if (stats.isFile()) {
		if ( config['www_standalone'] === true ) {
			var config 		= require("./config.json");									// kurunt: this is your config settings (www locally).  
			var g 			= require("./functions.js");								// global functions and variables (www locally).  			
		} else {
			var config 		= require("../config.json");								// kurunt: this is your config settings.  
			var g 			= require("../src/functions.js");							// global functions and variables.  
		}
	} else {
		var config 			= require("./config.json");									// kurunt: this is your config settings (www locally).  
		var g 				= require("./functions.js");								// global functions and variables (www locally).  	
	}
}
catch (e) {
	var config 				= require("./config.json");									// kurunt: this is your config settings (www locally).  
	var g 					= require("./functions.js");								// global functions and variables (www locally).  	
}
 */
var config 		= require("../config.json");											// kurunt: this is your config settings.  
var g 			= require("../src/functions.js");	


// start www if www_standalone = true, else will be started by kurunt main.
if ( config['www_standalone'] === true ) {
	startwww(etl, function (callback) {
		// started.
	});
}


// server. wraped in function with callback so kurunt can call on startup (if www_standalone = false).
function startwww(getl, cb) {
	etl = getl;
	
	lg.log('*Starting WWW');
	var sio = '';
	
	nimble.series([
		function (callback) {
			app.listen(config['www_port'], function(){
				
				// start socket.io.
				sio = io.listen(app);
				
				// use socket.io authorization handshake to set express.sid
				var parseCookie = require('/usr/local/lib/node_modules/express/node_modules/connect').utils.parseCookie;
				sio.set('authorization', function (data, accept) {
					// check if there's a cookie header
					if (data.headers.cookie) {
						// if there is, parse the cookie
						data.cookie = parseCookie(data.headers.cookie);
						// note that you will need to use the same key to grad the
						// session id, as you specified in the Express setup.
						data.sessionID = data.cookie['express.sid'];
					} else {
					   // if there isn't, turn down the connection with a message
					   // and leave the function.
					   return accept('No cookie transmitted.', false);
					}
					// accept the incoming connection
					accept(null, true);
				});

				// on a 'connection' event
				sio.sockets.on('connection', function (socket) {
				   lg.logDebug('--> connected, check identify -->');
					socket.emit('identify', { socketid: socket.id });
					socket.on('check_in', function (incoming) {
						if ( lg.clients[socket.id] == undefined ) {
							// validate api_key.
							lg.clients[socket.id] = [];
							lg.clients[socket.id]['socketid'] = socket.id;
							lg.clients[socket.id]['api_key'] = incoming.api_key;
							lg.clients[socket.id]['report'] = incoming.report;
							lg.clients[socket.id]['data'] = incoming;
							//lg.clients[socket.id]['count'] = 0;
							lg.logDebug('add client: ' + lg.clients[socket.id]['api_key'] + ' with sock: ' + lg.clients[socket.id]['socketid']);
							//lg.logDebug('DUMP> ' + util.inspect(lg.clients, true, 99, true));
						}
					});
				  
					socket.on('request', function (incoming) {
						// validate api_key
						
						lg.clients[socket.id]['report'] = incoming.report;
						lg.clients[socket.id]['data'] = incoming;
						
						lg.logDebug('--> requested data');
						//lg.logDebug('DUMP> ' + util.inspect(lg.clients, true, 99, true));
						
					});  
				  
					socket.on('disconnect', function() {
						lg.logDebug('Disconnecting client sockid: ' + socket.id);
						delete lg.clients[socket.id]
					});		  
				  
				});				

				callback();						// local callback.
			});
		},
		function (callback) {	
			// load local functions and global variables.
			lg.startup(g, function () {
				callback();						// local callback.
			});			
		},
		function (callback) {	
			lg.logDebug('set routes');
			//set global functions and variables (functions.js)
			routes.glob(g,lg,etl,sio);
			// Routes:
			app.get('/', routes.index);
			app.post('/', routes.index);
			//app.get('/users', routes.users);
			app.get('/settings', routes.settings);
			app.post('/settings', routes.settings);					
			app.get('/data', routes.data);
			app.post('/data', routes.data);
			app.get('/query', routes.query);
			app.post('/query', routes.query);	
			app.get('/reports', routes.reports);
			app.post('/reports', routes.reports);	
			// routes reports (dynamically).
			app.get('/reports/:report', routes.report);
			callback();						// local callback.
		},		
		function (callback) {	
			lg.log("*WWW server running, open your browser to http://" + config['www_host'] + ':' + config['www_port'] + '/', app.address().port, app.settings.env);
			cb();								// back to kurunt main.
		}
	]);
	
}


var app = module.exports = express.createServer();
// Configuration (with session support, ie: command 'express -s' in kurunt/www/
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options', { pretty: true });									// true = output HTML with indenting, false = compact to single line.
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({secret: 'secret', key: 'express.sid'}));	
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	app.use(express.static(__dirname + '/reports'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});


module.exports.startwww		= startwww;		// expose to kurunt main.
