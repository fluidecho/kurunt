# Kurunt

"Kurunt" for real-time processing of streaming data at any scale, using node.js.  

Can be used to capture, process and store both big and small data. Useful for real-time: analytics, applications, ETL and time series data.  

Simple to use 'stand-alone' through its web admin, or as a 'framework' node.js module.

### *** UNDER DEV, COMING SOON (star me if interested) ***

## Features

- Streaming system, processing message events in real-time.
- Implemented in 100% javascript for node.js.
- Scalable across machines or on a single cpu, from BeagleBone to the cloud.
- Supports any data type and format, json, ascii, binary, etc.
- Fault tolerant message delivery, can be setup with no single point of failure.
- Uses zeromq like (axon) message patterns for processing.
- Uniquely id's messages sequentially and in time series format.
- Build as a framework, can be used as a node.js module or run stand-alone.
- Fast (~1,000,000 tuples/s).

## Installation

From your terminal, requires [node.js](http://nodejs.org/).

```
npm install -g kurunt
```

## Use

To launch Kurunt, from your terminal:

```
kurunt
```

Then to administer can open your browser at:

```
http://127.0.0.1:8888
```


## Module
You can run Kurunt either stand-alone or as a module. To use as a module you will need to create a worker and a store file, as shown below. An example of these can be found in /examples/asmodule/.

```js
var Kurunt        = require("kurunt");

var workers       = {};
workers.myworker  = __dirname + '/myworker.js';		// full path to your worker function.

var stores        = {};
stores.mystore    = __dirname + '/mystore.js';		// full path to your store function.


// init: {config}, {topology}, {workers}, {stores}, (callback function).
Kurunt.init(undefined, undefined, workers, stores, function(kurunt) {

	// form new stream.
	var tags = ['test', 'asmodule'];
	var use_stores = ['mystore', 'stream'];		// have set mystore as set above, as well as stream so can view in 'Stream Report'.

	// newStream: input, worker, [stores], [tags], [access_hosts], (callback function).
	kurunt.newStream('tcp', 'myworker', use_stores, tags, [], function(stream) {

		// can now form and send my message into the stream. There are lots of ways you can input data: http://docs.kurunt.com/Input_Data.
		var mymessage = {};
		mymessage.hello = 'world';
		mymessage.num = 101;
		mymessage.fab = true;

		// will send this message in JSON, as that is the format myworker.js is expecting, could use any message format matching worker.
		kurunt.send(stream, JSON.stringify(mymessage), function (e, sent) {
			console.log('asmodule.js> sent message: ' + sent);
		});

	});

});
```
myworker.js
```js
// must export 'work' module.
module.exports.work = function (message, wk, fn, callback) {
	// use try catch so can skip over invalid messages.
	try {

		//console.log('myworker@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

		// Can process the message anyway you want, use: functions, parse, regex, filter, augment, geoip, etc.

		var mymessage = JSON.parse( message.message.toString(wk['config']['encoding']) );		// example for JSON formatted data.
		//console.log('myworker@workers> mymessage: ' + require('util').inspect(mymessage, true, 99, true));    // uncomment to debug message.
		
		// Can set the attributes, as they match with: config.stores.mystore.schema.
		var attributes = [];
		attributes['mymessage'] = mymessage;

		return callback( [ message, attributes ] );		// must return.
	
	} catch(e) {
		//console.log('myworker@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
		return callback( false );		// must return.
	}
};


// set the worker config, or call a json config file via require.
var config = {
	"name": "myworker",
	"title": "My Worker",	
	"description": "Using Kurunt as a module framework, My Worker.",
	"inputs": [ "tcp", "udp", "http" ],
	"mq_nodelay": false,
	"reports": [ "stream" ],
	"message_codec": "json",
	"encoding": "utf8",
	"stores": [
		{
			"mystore": {
				"schema": {
					"mymessage": { }
				}
			}
		}	
	]
};
exports.config = config;		// must export the config so kurunt can read it.
```
mystore.js
```js
// must export 'store' module.
module.exports.store = function (message, report, callback) {
  // use try catch so can skip over invalid messages.
  try {
  
    //console.log('mystore@stores> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
    // Here can do whatever you want to: store, socket.io, fs, db, index, etc, this message.

    // Can extract mymessage from 'mystore' schema.
    var mymessage = undefined;
    for ( var s in message.stores ) {
      for ( var st in message.stores[s] ) {
        if ( st === 'mystore' ) {
          mymessage = message.stores[s][st]['schema']['mymessage']['value'];    // may want to "clone" message.
        }
      }
    }

    console.log('mystore@stores> mymessage: ' + require('util').inspect(mymessage, true, 99, true));    // here it is, yea!

    return callback( true );    // must return.
  
  } catch(e) {
    //console.log('mystore@stores> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );   // must return.
  }
};
```


## How does it work?

Kurunt is made up of three components: inputs, workers and stores. 
<pre>
       *****************
       *   YOUR DATA   *  (json, syslog, csv, sensors, jpeg, access_log, tail, etc)
       *****************
               |
               v
          ***********
          *  INPUT  *  (tcp, udp, http)
          ***********
             |   |
     +-------+   +-------+
     |                   |
     v                   v
**********          **********
* WORKER *          * WORKER *  (functions, parse, regex, filter, augment, geoip, etc)
**********          **********
     |                   |
     +-------+   +-------+
             |   |
             v   v
          ***********
          *  STORE  *  (stream, socket.io, mongo, mysql, hadoop, S3, solr, sphinx, etc)
          ***********
</pre>

Above shows how the message (your data) is processed using the default topology, you can however create all sorts of patterns for scalability and fault-tolerance. These components run on separate processes, either on a single node or across multiple nodes or a combination, as set in: topology.json.

#### Your Data
Could be nearly anything, like: json, syslog, access_log, web, jpeg, csv, msgpack, tail a file, arduino sensors, clickstream, twitter firehose, etc.

#### Inputs
Kurunt opens inputs 'streams' to your data using: TCP, UDP or HTTP.

#### Workers
Process the messages any way you want. Turn structured, semi-structured or unstructured data into something that you can use. Use functions, parse, regex, filter, augment, geoip, etc. Use an existing worker, or it's easy to build your own custom workers in just a few lines of Javascript. 

#### Stores
Store your now 'schemed' messages any way you want. In your favorite database, filesystem, data grid, search engine, or don't store your messages but 'stream' them, stream api (default), socket.io.

#### Stream Report
You can visualize your data from within the [web admin](http://127.0.0.1:8888) 'report' (requires socket.io to be installed > npm install socket.io). See the messages live as they come in, pause/play messages for analysing. 

#### Why do all of this?
The simplest answer is for efficiency. There is a limit to how much 'processing' a single node.js process can do. You'll eventually need more processes and to be fault-tolerant more machines.


## Performance

#### Benchmark

You can benchmark Kurunt by opening a 'stream' (eg: JSON), using the [web admin](http://127.0.0.1:8888). And run the data simulation client.
```
> perl /kurunt/lib/workers/json/benchmark.pl -T=tcp -P=6001 -m=1 -c=1
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d (optional) = the string data you want to send. -help for more info.

#### Results

Results depend a little bit on what you mean by "message processing", I mean it to be a single message from ingestion (input) to worker (test) to store (stream) - around 20,000 (upto 50,000) messages per second on a single machine to fully process with a sub 1 second latency. It can ingest (input) data much faster in the 100,000s messages per second. The topology you set will determine performance.

Tuple testing: Sending 100 tuples (comma separated values: A,B,C,...) in each message, I get in-excess of 10,000 (peeking at 16,000) messages per second * 100 tuples extracted = 1,000,000 tuples per second, processed.


## License

Choose either: [MIT] (http://opensource.org/licenses/MIT) or [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

