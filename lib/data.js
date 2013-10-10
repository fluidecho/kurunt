//
// Data
//
// Version: 0.2
// Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
// License: MIT or Apache 2.0.
//
// Copyright (c) 2013 Mark W. B. Ashcroft.
// Copyright (c) 2013 Kurunt.
//



// load dependencies.
var util 						= require('util');
var fs 						= require('fs');


exports._getData 					= _getData;




function _getData(config, cb) { 
	//config.xlog('loading data');

	var data 					= require('.././data.json');

	//console.log('datas> ' + util.inspect(datas, true, 99, true));
	cb(data);
	return true;

	
}


function _newData(config, nodes, inputs, worker, stores, tags, access_hosts, cb) { 
	//config.xlog('loading data');

	var data 					= require('.././data.json');

	//console.log('datas> ' + util.inspect(datas, true, 99, true));
	cb(data);
	return true;

	
}



function _saveDatas(config, cb) { 
	config.xlog('saving datas to data.json');

	//var datas 					= require('.././data.json');

	//console.log('datas> ' + util.inspect(datas, true, 99, true));
	cb(datas);
	return true;

	
}





