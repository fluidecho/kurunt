//
// Kurunt Stores
//
// Loads and routes messages from workers to stores for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var util 							= require('util');
var messenger 				= require('./messenger');

var config 						= undefined;
var topology 					= undefined;

var fs 								= require('fs');
var cluster 					= require('cluster');
var cp 								= require('child_process');

//exports._load 				= _load;
var version 					= 0.2;
var loaded 						= false;

process.on('SIGINT', function() {
	console.log(processID + '@stores> SIGINT, exit.');
  process.exit(code=0);
});



//var events 				= require('events');





var stores = {};


var mps = 0;
var tot = 0;


// listen for topology.js to set config and topology then load this.
process.on('message', function(m) {
	console.log('*stores, process.on.message>' + util.inspect(m, true, 99, true));
	if ( m.config !== undefined ) {
		config = JSON.parse(m.config);
	}
	if ( m.topology !== undefined ) {
		topology = JSON.parse(m.topology);
	}	
	_init(config, topology);
});


var processID = '*#' + process.pid;





//var _messages = new events.EventEmitter();

//exports._messages = function() {
//	return new _messages();
//}
//util.inherits(_messages, events.EventEmitter);
/*
_messages.on('message', function(message){
	console.log('message: ' + message);
	var self = this;
    
  var m = JSON.stringify(message);
  var reply = null;
  self.emit('message', m, reply);	
});
*/

/*
function Downloader() {
    if(false === (this instanceof Downloader)) {
        return new Downloader();
    }
    
    events.EventEmitter.call(this);
}
util.inherits(Downloader, events.EventEmitter);
Downloader.prototype.download = function() {

    var self = this;
    self.emit('message', 'hello'); 

}
exports.Downloader = Downloader;
*/

/*
function msgs() {
	//var self = this;
	
	Master.on('an_event', function () {
  console.log('an event has happened');
  
  				//var reply = null;
				//self.emit('message', m, reply);	
  var m = JSON.stringify(message);
});
	
	
}
*/

function _init(config, topology) {

	console.log(processID + "@stores> initiating.");

	_loadAllStores();

	var all_zmq_connect = true;
	var messages = [];
	var connections = [];
	
	if ( topology != undefined ) {
		var c = 0;
		for ( c = 0; c < topology['connections'].length; c++ ) {
			//console.log('connections> ' + util.inspect(topology['connections'][c], true, 99, true));
			//console.log('ZMQ this connection!!!');
			connections.push(topology['connections'][c]);
			if ( topology['connections'][c]['zmq_socket'] != 'connect' ) {
				all_zmq_connect = false;
			}
		}
	}
	
	// fn (worker functions) prototype for woker to call.
	var Fn = function() { };
	Fn.prototype.hello = function() { return console.log('world'); };
	Fn.prototype.pause = function() { return messenger.pause() };
	Fn.prototype.resume = function() { return messenger.resume() };
	var fn = new Fn();
		 
	setInterval(function () {		
		console.log(processID + '@stores> mps: ' + mps + ' total: ' + tot);
		mps = 0;		// reset
	}, 1000);	
	
	var u = 0;
	var rep = {};
	
	

	
	var messages = messenger.init(config, connections);
	messages.on('message',  function(x, message, reply) {
		//console.log('storemessageDUMP> ' + util.inspect(message, true, 99, true));
			
			
		mps++;
		tot++;
			
				
				//console.log('message> ' + util.inspect(message, true, 99, true));
				
			//_messages.emit('message', message);
		//	Master.emit(m);
			
/*
		// route message by store
		stores[message.worker]['module'].store(message, function(res) {






				
			u++;
				
			// expreimental feature for guaranteed message delivery!
			if ( reply !== undefined ) {
				if ( u === 1 ) {
					delete rep;
					rep = {};
					rep.idb = x.idb;
					rep.messages = [];
					rep.downstream = x.downstream;
				}
				rep.messages.push(u.toString());
				if ( u === x.mLen ) {
					u = 0;
					console.log('commited this message: ' );
					//console.log('reply> ' + util.inspect(rep, true, 99, true));
					reply(rep);
				}
			}

		});
		*/
			
	});	
	loaded = true; 
}



function _loadAllStores() {

	var w = 0;
	// load each store with require
	// look within directory /lib/stores/ to discover available stores.
	
	// load inputs nativly through node require.
	fs.readdir(__dirname, function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(store){
			//console.log('store: ' + store);
			
			var stats = stats = fs.lstatSync(__dirname + '/' + store);
			if (stats.isDirectory()) {
				// if /lib/stores/_mystore will ignore the underscored directories.
				// NOTE: if you only want particular stores to load, underscore unwanted directories.
				if ( store.substring(0, 1) != '_' ) {
					// add store
					var this_config = require('./' + store + '/config.json');
					console.log('store to load: ' + this_config['title']);
					
					stores[store] = [];
					
					stores[store]['config'] = this_config;
					
					if ( !stores[store]['config']['encoding'] ) {
						stores[store]['config']['encoding'] = 'utf8';
					}
					
					stores[store]['module'] = require('./' + store + '/index.js');
					//stores[store]._load('', storeid);
					w++;
				}
			
			}
		
		});	
	});

}


