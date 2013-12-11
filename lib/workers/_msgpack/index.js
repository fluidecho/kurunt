//
// Kurunt msgpack Worker
//
// MessagePack 'worker' for Kurunt, processing msgpack formated data.
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//


var msgpack = undefined;		// set in init.
exports.msgpack = msgpack;

module.exports.init = function () {
	try {
		this.msgpack = require('msgpack-js');
	} catch(e) {
		console.log('msgpack@worker> To use the msgpack worker you\'ll need to install the msgpack module: npm install msgpack-js -g');
	}
	//console.log('msgpack@workers> init function loaded.');
};


// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {

  // 'message.message' Format: msgpack
  // Sample: '�hello world'
  //
  // See: http://docs.kurunt.com/MsgPack_Worker
  // msgpack-js: https://github.com/creationix/msgpack-js
  // MessagePack: http://wiki.msgpack.org/display/MSGPACK/Format+specification

  //console.log('msgpack@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
		
    var msgunpacked = wk['module'].msgpack.decode(message.message);		// NOTE: don't _.toString() message as _.decode(_) does that.
    
    var attributes = [];
    attributes['msgpack'] = msgunpacked;

    return callback( [ message, attributes ] );
  
  } catch(e) {
    //console.log('msgpack@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );
  }

};

