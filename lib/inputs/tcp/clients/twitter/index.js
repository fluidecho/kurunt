var twitter = require('ntwitter');	// see: https://npmjs.org/package/ntwitter
var net = require('net');


// !!! NOTE !!! rename file _keys.json to keys.json
var keys = require('./keys.json');
/*
// can overide keys.json and use below:
var keys = [];
var keys['CONSUMER_KEY'] = '';
var keys['CONSUMER_SECRET'] = '';
var keys['ACCESS_TOKEN_KEY'] = '';
var keys['ACCESS_TOKEN_SECRET'] = '';
*/

var KURUNT_TCP_INPUT_PORT = 5558; 


var twit = new twitter({
  consumer_key: keys['CONSUMER_KEY'],
  consumer_secret: keys['CONSUMER_SECRET'],
  access_token_key: keys['ACCESS_TOKEN_KEY'],
  access_token_secret: keys['ACCESS_TOKEN_SECRET']
});


var client = net.connect({port: KURUNT_TCP_INPUT_PORT}, function() {
  console.log('connected to kurunt TCP input');
  
	twit.stream('statuses/sample', function(stream) {
		stream.on('data', function (data) {
			/*
			var obj = {};
			//obj.tweet = data.text.toString();
			obj._id = Math.random();
			var json = JSON.stringify(obj);
			console.log(json);
			*/
			
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
