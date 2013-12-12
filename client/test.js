var sendData		= require("./send.js");

var streams		= require(".././streams.json");
var config		= require(".././config.json");
									
										sendData.init(config, streams);
										sendData.send('6002', function(msent) {
											console.log('msent to apikey:  message: ' + msent);
										});
										
										
										
										
