// SERVER

var tls = require('tls'),
    fs = require('fs'),
    colors = require('colors'),
    msg = [
            ".-..-..-.  .-.   .-. .--. .---. .-.   .---. .-.",
            ": :; :: :  : :.-.: :: ,. :: .; :: :   : .  :: :",
            ":    :: :  : :: :: :: :: ::   .': :   : :: :: :",
            ": :: :: :  : `' `' ;: :; :: :.`.: :__ : :; ::_;",
            ":_;:_;:_;   `.,`.,' `.__.':_;:_;:___.':___.':_;" 
          ].join("\n").cyan;

var options = {
  key: fs.readFileSync('server-private-key.pem'),
  cert: fs.readFileSync('server-certificate.pem'),
 
  // This is necessary only if using the client certificate authentication.
  // Without this some clients don't bother sending certificates at all, some do
  requestCert: true,
 
  // Do we reject anyone who certs who haven't been signed by our recognised certificate authorities
  rejectUnauthorized: true,
 
  // This is necessary only if the client uses the self-signed certificate and you care about implicit authorization
  ca: [ fs.readFileSync('client-certificate.pem') ]
 
};

tls.createServer(options, function (socket) {

	socket.setEncoding('utf8');
  socket.write(msg+"\n");
  //socket.write("A\n");
  //socket.write("B\n");
  //socket.end('');
  socket.pipe(socket);
	//socket.write("C\n");
  
	socket.on('data', function(chunk) {
		console.log('tls@inputs> Got chunk : ' + chunk);
		//console.log('tls@inputs> chunk : ' + require('util').inspect(chunk, true, 99, true));
	});  
  

}).listen(8443);


 /*
var server = tls.createServer(options, function(cleartextStream) {
 
  //Show the certificate info as supplied by the client
  console.log(cleartextStream.getPeerCertificate());
 
  console.log('server connected',
              cleartextStream.authorized ? 'authorized' : 'unauthorized');
  cleartextStream.write("welcome!\n");
  cleartextStream.setEncoding('utf8');
  cleartextStream.pipe(cleartextStream);
});
server.listen(443, function() {
  console.log('server bound');
});

*/
