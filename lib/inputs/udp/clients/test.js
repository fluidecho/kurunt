var net = require('net');




var KURUNT_TCP_INPUT_PORT = 5555; 

var client = net.connect({port: KURUNT_TCP_INPUT_PORT}, function() {
  console.log('connected to kurunt TCP input');
  
  var x = 0;
  for ( x = 0; x < 2; x++ ) {
  
			var obj = {};
			//obj.tweet = data.text.toString();
			obj._id = Math.random();
			var json = JSON.stringify(obj);
			console.log(json);
			
			
		  client.write(Math.random() + '\n');
	}

});


client.on('end', function() {
	console.log('disconnected from kurunt TCP input');
});
