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



module.exports.route = function (messenger, apikey, input, worker, stores, tags, client, message) {

	messenger.push(apikey, input, worker, stores, tags, client, message);

}

