//
// Kurunt, Twitter.
//
// Twitter's Streaming API.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


// Need to install ntwitter node module> npm install ntwitter


var Kurunt    = require("../../");            // kurunt module.
var twitter   = require('ntwitter');          // see: https://npmjs.org/package/ntwitter, install: npm install ntwitter

// NOTE: !!! rename file _keys.json to keys.json or use require('./_keys.json') instead.
var keys      = require('./keys.json');       // must have/create a twitter 'application' at: https://dev.twitter.com, then set keys within this file.


var twit = new twitter({
  consumer_key: keys['CONSUMER_KEY'],
  consumer_secret: keys['CONSUMER_SECRET'],
  access_token_key: keys['ACCESS_TOKEN_KEY'],
  access_token_secret: keys['ACCESS_TOKEN_SECRET']
});



Kurunt.init([__dirname + '/process_tweet.js'], [__dirname + '/store_tweet.js'], function(e, kurunt) {

  if (e) {
  	console.trace('Error: ' + e);
  	process.exit(1);		// exit this program.
  }

	kurunt.events.on('error',  function(e) {
		console.trace('Error: ' + e);
  	kurunt.exit();			// exit all running processes as set within topology.json.
  	process.exit(1);		// exit this program.
	});

  kurunt.newStream('tcp', 'process_tweet', ['store_tweet', 'stream'], [], [], function(stream) {
    console.log('Can view processed tweets at >>> http://127.0.0.1:9001/ <<<\nCtrl+c to exit.\n...');   // report requires socket.io.

    twit.stream('statuses/sample', function(api) {

      api.on('data', function (tweet) {
        kurunt.send(stream, JSON.stringify(tweet), function (sent) {
          // send tweet into kurunt for processing/storage.
        });
      });

      api.on('end', function (response) {
        console.log('twitter disconnected');
        process.exit(0);  // exit.
      });

    });
    
  });
  
});

