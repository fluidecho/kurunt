//
// TCP Router
//
// Routes messages and resolves clients address with allowed access hosts.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var config				= require("./config.json");								// your config settings.
var log 				= function(txt) { if ( config['quiet'] === false ) { console.log(txt); } };

var messenger			= require("./messenger");


function route(apikey, worker, stores, tags, client, message) {

/*
	if ( client['address'] != access_host ) { ...

	} else {
		// disconect this client.
		client['socket'].end(); 		// disconect client.


	// check this client is in access list.
	// if access list is in discovery mode, add this client to list.
	if ( clients[rAddress + ":" + rPort]['apikey'] == undefined ) {
		log("Client " + rAddress + ":" + rPort + " is not using a valid (open) apikey, will try disconnecting client.");
		clients[rAddress + ":" + rPort]['socket'].end(); 		// disconect client.
		clients.splice(clients[rAddress + ":s" + rPort], 1);
		return false;
	}
*/



	messenger.push(apikey, worker, stores, tags, client, message);

}


exports.route 			= route;											// expose.
