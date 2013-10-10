var twitter = require('ntwitter');
var net = require('net');

var KURUNT_TCP_INPUT_PORT = 7777; 

var CONSUMER_KEY = 'SlLArQhadDVWIGZBpQNaw';
var CONSUMER_SECRET = 'mifGcQksWj89s78NQqBaTdzJzkGW5CtPVewVIJCzg';
var ACCESS_TOKEN_KEY = '531798750-Rw4dpEGAHOZJomQ0Fn5PDwdaWeBgCZ7wmYqCb264';
var ACCESS_TOKEN_SECRET = 'EF6XRdrgqcl2yMELy6NixI4Rv5H7zW0j6uCfpiDfs';


var twit = new twitter({
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  access_token_key: ACCESS_TOKEN_KEY,
  access_token_secret: ACCESS_TOKEN_SECRET
});


var client = net.connect({port: KURUNT_TCP_INPUT_PORT}, function() {
  console.log('connected to kurunt TCP input');
  
	twit.stream('statuses/sample', function(stream) {
		stream.on('data', function (data) {
		  client.write(JSON.stringify(data) + '\n');
		});
		
		stream.on('end', function (response) {
    	console.log('twitter disconnected');
    	process.exit(0);	// exit.
		});				
	});
	

});


client.on('end', function() {
	console.log('disconnected from kurunt TCP input');
});
