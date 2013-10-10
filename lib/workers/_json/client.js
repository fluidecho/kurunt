var net = require('net');

var x = 0;

var client = net.connect({port: 5555, host: '192.168.7.1'},
    function() { //'connect' listener
  console.log('client connected');
  
  
  for ( x = 0; x < 100; x++ ) {
  	 client.write('hello,world,from,beaglebone!\n');
  }
  
  
 
});
client.on('data', function(data) {
  //console.log(data.toString());
  //client.end();
});
client.on('end', function() {
  console.log('client disconnected');
});

