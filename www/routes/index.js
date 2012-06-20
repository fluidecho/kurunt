//
// Routes Requests to webpages.
//


var config 				= require("../../config.json");										// kurunt: this is your config settings.  
var fs 					= require('fs');


// load globals (from www.js) so pages can use these universally (globally).
var g 					= '';	
var lg 					= '';																// global functions and variables (passed from www.js).
var etl					= '';
var sio					= '';
exports.glob 			= function(glob, lglob, getl, gio) {
	g 					= glob;
	lg					= lglob;
	etl					= getl;
	sio					= gio;
}


/*
 * GET home page (login).
 */
var indexF	 			= require("../handlers/index.js");									// loads up handler functions on start.
exports.index 			= function(req, res) {
	indexF._request(req, res, config, g, lg, function (cb) {
		if ( cb === 0 ) {
			lg.logDebug('going to login page');
			res.render('index', { title: 'home', config: config, g: g, lg: lg, values: cb });
		}
		if ( cb === 1 ) {
			lg.logDebug('going to settings page');
			res.redirect('/settings/');
		}
		if (  cb === 2 ) {
			lg.logDebug('going to data page');
			res.redirect('/data/');
		}			
	});
};


/*
 * GET settings.
 */
var settingsF	 		= require("../handlers/settings.js");								// loads up handler functions on start.
exports.settings 		= function(req, res) {
	lg.user_session(req, res, function(cb) {
		if ( cb ) {		
			settingsF._request(req, res, config, g, lg, function (cb) {
				res.render('settings', { title: 'Settings', config: config, g: g, values: cb });
			});
		} else {
			//lg.logDebug('going to login page');
			//res.render('index', { title: 'home', config: config, g: g, lg: lg, values: cb });
			lg.logDebug('going to 404');
			res.send('404 <a href="/">login again -></a>', 404);			
		}
	});
};


/*
 * GET data.
 */
var dataF	 			= require("../handlers/data.js");									// loads up handler functions on start.
exports.data 			= function data(req, res, next) {
	lg.user_session(req, res, function(cb) {
		if ( cb ) {
			dataF._request(req, g, etl, function (cb) {
				//g.logDebug('etl_render: ' + etl);
				res.render('data', { title: 'Data', config: config, g: g, values: cb, fs: fs });
			});
		} else {
			lg.logDebug('going to 404');
			res.send('404 <a href="/">login again -></a>', 404);	
		}
	});
};


/*
 * GET query.
 */
var queryF	 			= require("../handlers/query.js");									// loads up handler functions on start.
exports.query 			= function(req, res) {
	lg.user_session(req, res, function(cb) {
		if ( cb ) {
			queryF._request(req, function (cb) {
				res.render('query', { title: 'Query', config: config, g: g, values: cb });
			});
		} else {
			lg.logDebug('going to 404');
			res.send('404 <a href="/">login again -></a>', 404);		
		}
	});
};


 /*
 * GET reports.
 */
exports.reports 		= function(req, res) {
	lg.user_session(req, res, function(cb) {
		if ( cb ) {
			res.render('reports', { title: 'Reports', config: config, g: g, reports: lg.reports, fs: fs });
		} else {
			lg.logDebug('going to 404');
			res.send('404 <a href="/">login again -></a>', 404);	
		}
	});
};
 

 /*
 * GET report (specific).
 */
exports.report 			= function(req, res, next) {
	lg.user_session(req, res, function(cb) {
		if ( cb ) {
			var report = req.params.report;
			if (report) {
				//console.log('report: ' + lg.reports[report]['config']['title'] );
				//console.log('sessionid: ' + req.sessionID);
				lg.reports[report]._connect(config, g, lg, sio, req);					// load function for client connecting to this report.
				res.render(config['www_path'] + '/reports/' + report + '/index.jade', { title: lg.reports[report]['config']['title'], report: report, config: config, g: g, lg: lg, sio: sio, sessionid: req.sessionID, req: req });
			} else {
				next();
			}
		} else {
			lg.logDebug('going to 404');
			res.send('404 <a href="/">login again -></a>', 404);	
		}
	});
};
