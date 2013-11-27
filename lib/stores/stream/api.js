//
// Kurunt Stream API
//
// Stream(ing) API for Kurunt.
// Version: 0.2
// Author: Mark W. B. Ashcroft
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var http        = require('http');
var config      = require("../../.././config.json");        // global config.

var log         = function(txt) { if ( config['debug'] === 'benchmarking' || config['debug'] === 'debug' ) { console.log(txt); } };

var clients     = {};   // array (objs) of connected clients.


module.exports.message = function (message, callback) {
  //console.log('api:stream@stores, message> ' + require('util').inspect(message, true, 99, true));
  for ( var client in clients ) {
    // send data by valid channel.
    if ( message.apikey.toString() === clients[client]['channel'] || message.tags.indexOf(clients[client]['channel']) != -1 || clients[client]['channel'] === 'all' ) {
      log('api:stream@stores> send message to clientID: ' + clients[client]['id'] + ' for channel: ' + clients[client]['channel']);
      clients[client]['res'].write( JSON.stringify(message) + '\n' );   // delineate by linefeed.
    } else {
      log('api:stream@stores> skip invalid channel.');
    }       
  }
  
  return callback( true );
  
};


function onRequest(request, response) {

  // if client request favicon return.
  if (request.url === '/favicon.ico') {
    response.writeHead(200, {'Content-Type': 'image/x-icon'} );
    response.end();
    return;
  } 
  
  var header = request.headers['authorization']||'',        // get the header
    auth_token = header.split(/\s+/).pop()||'',             // and the encoded auth token
    auth = new Buffer(auth_token, 'base64').toString(),     // convert from base64
    auth_parts = auth.split(/:/),                           // split on colon
    auth_username = auth_parts[0],                          // coresponds to the data's apikey requesting.
    auth_password = auth_parts[1];                          // match against config['stream_api_pass'].

  var channel = auth_username;                              // set client suth username for the data's apikey or tag.

  //console.log('api:stream@stores> user, channel is "'+channel+'" and password is "'+auth_password+'"');

  // validate password is either: pass or config['streaming_api_password'].
  if ( channel != 'all' && config['stream_api_pass'] != auth_password || (config['stream_api_all_pass'] != auth_password && channel === 'all') ) {
    response.writeHead(401, {'WWW-Authenticate': 'Basic realm="Kurunt Stream API"', 'Content-Type': 'application/json', 'Connection': 'closed'});
    response.end('{"message":"not valid auth"}\n');
    return;
  }
  
  // all, not by apikey or tag.
  if ( channel === 'all' && auth_password != config['stream_api_all_pass'] ) {
    response.writeHead(401, {'WWW-Authenticate': 'Basic realm="Kurunt Stream API"', 'Content-Type': 'application/json', 'Connection': 'closed'});
    response.end('{"message":"not valid auth"}\n');
    return;
  } 
  
                                
  
  var ip = _ipAddress(request);   // get the requestors ip address.
  var clientID = ip + ":" + request.connection.remotePort;
  
  // set client within client array so can broadcast messages to each (as in: message function).
  clients[clientID] = [];
  clients[clientID]['id'] = clientID;
  clients[clientID]['res'] = response;
  clients[clientID]['channel'] = channel;
  
  // route message based on username as apikey or tag.
  log('api:stream@stores> Valid user, username is "'+auth_username+'" and password is "'+auth_password+'"');  
  log('api:stream@stores> Client connect. Last request for: ' + request.url + ' by ip: ' + ip + ' clientID: ' + clientID);

  request.connection.addListener('close', function () {
    log('api:stream@stores> Client closed. Last request for: ' + request.url + ' by ip: ' + ip + ' clientID: ' + clientID);
    delete clients[clientID];     // remove this client from clients array.
  }); 
  
  // NOTE: charset is set to utf-8 by default, change if needed.
  response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Connection': 'keep-alive'});     

} // end onReceive.


var server = undefined;   // server open.
if ( config['stream_api'] === true ) {
  server = http.createServer(onRequest).listen(config['stream_api_port']);      // Start a HTTP Server.
  log("api:stream@stores> Stream API Server has opened on port " + config['stream_api_port'] + ".");
} else {
  log("api:stream@stores> Stream API is closed.");
}


function _ipAddress(request) {
  // try request.connection.socket.remoteAddresponses for https, request.socket.remoteAddresponses works for most http but request.connection.remoteAddress seems more reliable.
  var ip = undefined;
  try {
    ip = request.headers['x-forwarded-for'];
    if ( ip === undefined ) {
      ip = _remoteAddress(request);
    }
  } catch ( err ) {
    ip = _remoteAddress(request); 
  }
  return ip;
}
function _remoteAddress(request) {
  var ip = undefined;
  ip = request.connection.remoteAddress;
  if ( ip === undefined ) {
    ip = request.socket.remoteAddresponses;
    if (ip === undefined) {
      return false;
    }
  }
  return ip;  
}

