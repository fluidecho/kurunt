//
// UDP Router
//
// Routes messages and resolves clients address with allowed access hosts.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013-2014 Mark W. B. Ashcroft.
// Copyright (c) 2013-2014 Kurunt.
//


module.exports.route = function (apikey, input, client_address, message, id, messenger, streams, callback) {

	var access_hosts = streams[apikey].access_hosts;
	//console.log('router:tcp@inputs> access_hosts: ' + apikey + ':' + require('util').inspect(access_hosts, true, 99, true));

	// verify client address is found in streams.json access_hosts.
	var allow = false;
	if ( access_hosts.length === 0 ) {
		allow = true;		// no access hosts set to check.
	} else {
		for ( var a in access_hosts ) {
			//log('access_hosts: ' + access_hosts[a] + ' clientAddress: ' + client_address);
			if ( access_hosts[a] === '' ) { 		// allow any host.
				allow = true;
				break;
			} else if ( client_address === access_hosts[a] ) {			// allowed host.
				allow = true;
				break;
			}
		}
	}
	
	if ( allow === false ) {
		return callback(false);		// not valid client.
	} else {
		messenger(apikey, message, id);		// calls messenger.push function.
		return callback(true);
	}
	
}

