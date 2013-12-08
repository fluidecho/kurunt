/*
var http 				= require('http');	

var options = {
  hostname: '127.0.0.1',
  port: 5555,
  path: '/123f45c',
  method: 'POST'
};

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});


var x = 0;

	
setInterval(function () {		
	if ( x > 5 ) {
		
	}


	x++;
}, 1000);


	req.write('data: 1' + x + '\n');
	req.write('data: 2' + x + '\n');
	//req.end();
	
*/


var http = require('http');


var myAgent = new http.Agent({maxSockets: 1});

  var req1 = http.get({
    host: '127.0.0.1',
    port: 5555,
    path: '/123f45c61',
    agent: myAgent
  }, function(res1) { 
  	// (A)
    res1.on('data', function(chunk) {
			console.log('res1: ' + chunk.toString());
    });

    // you should add the 'end' listener
    // before returning from function (A)
    res1.on('end', function() { 
    // (B)
      // you should request before returning from function (B)
      var req2 = http.get({
    host: '127.0.0.1',
    port: 5555,
    path: '/123f45c62',
        agent: myAgent
      }, function(res2) {

    res2.on('data', function(chunk) {
			console.log('res2: ' + chunk.toString());
    });

       
      });
      
    });
  
  });

	
