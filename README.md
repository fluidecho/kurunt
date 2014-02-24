# Kurunt

"Kurunt" for real-time processing of streaming data at any scale, using node.js.  

Can be used to capture, process and store both big and small data. Useful for real-time: analytics, applications, ETL and time series data.  

Simple to use 'stand-alone' through its web admin, or as a 'framework' node.js module.

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
```
node examples/asmodule/asmodule.js
```
asmodule.js
```js
var Kurunt = require("kurunt");

// init: topology, [workers], [stores], (callback function). [workers] and [stores] requires full path to your function file.
Kurunt.init(undefined, [__dirname + '/myworker.js'], [__dirname + '/mystore.js'], function(e, kurunt) {

  if (e) {
    console.trace('Error: ' + e);
    process.exit(1);		// exit this program.
  }

  kurunt.events.on('error',  function(e) {
    console.trace('Error: ' + e);
    kurunt.exit();			// exit all running processes as set within topology.json.
    process.exit(1);		// exit this program.
  });

  // newStream: input, worker, [stores], [tags], [access_hosts], (callback function).
  kurunt.newStream('http', 'myworker', ['mystore', 'stream'], [], [], function(stream) {

    // Can send my message into the stream. There are lots of ways you can input data: http://docs.kurunt.com/Input_Data.
    var mymessage = {};
    mymessage.hello = 'world';
    mymessage.num = 101;
    mymessage.fab = true;

    // will send this message in JSON, as that is the format myworker.js is expecting, could use any message format matching worker.
    kurunt.send(stream, JSON.stringify(mymessage), function (sent) {
      //kurunt.exit();    // can exit all kurunt processes (as set within topology) when has had time to complete message processing.
      console.log('Can input a message using curl, copy/paste into new terminal:\n---------------------------------------------------------------------------------------------------------------\ncurl -X POST -H "Content-Type: application/json" -d \'{"hello":"world"}\' ' + stream.address + '\n---------------------------------------------------------------------------------------------------------------\nCan view processed messages at >>> http://127.0.0.1:9001/ <<< or via API >>> ' + stream.api_address + ' <<< \nCtrl+c to exit.\n...');   // report requires socket.io. 
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

    console.log('myworker@workers> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

    // Can process the message anyway you want, use: functions, parse, regex, filter, augment, geoip, etc.

    var mymessage = JSON.parse( message.message.toString(wk['config']['encoding']) );   // example for JSON formatted data.
    //console.log('myworker@workers> mymessage: ' + require('util').inspect(mymessage, true, 99, true));    // uncomment to debug message.
    
    // Can set the attributes, as they match with: config.stores.mystore.schema.
    var attributes = [];
    attributes['mymessage'] = mymessage;

    return callback( [ message, attributes ] );   // must return.
  
  } catch(e) {
    //console.log('myworker@workers> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );   // must return.
  }
};

// set the worker config, or call a json config file via require.
var config = {
  "name": "myworker",
  "title": "My Worker", 
  "description": "Using Kurunt as a module framework, My Worker.",
  "inputs": [ "tcp", "udp", "http" ],
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
exports.config = config;    // must export the config so kurunt can read it.
```
mystore.js
```js
// must export 'store' module.
module.exports.store = function (message, callback) {
  // use try catch so can skip over invalid messages.
  try {
  
    console.log('mystore@stores> MESSAGE: ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.
    
    // Here can do whatever you want to: store, socket.io, fs, db, index, etc, this message.

    // Can extract mymessage from 'mystore' schema.
    var mymessage = undefined;
    for ( var s in message.stores ) {
      for ( var st in message.stores[s] ) {
        if ( st === 'mystore' ) {
          mymessage = message.stores[s][st]['schema']['mymessage']['value'];    // may want to "clone" message.
          //console.log('mystore@stores> mymessage: ' + require('util').inspect(mymessage, true, 99, true));    // here it is, yea!
        }
      }
    }

    return callback( true );    // must return.
  
  } catch(e) {
    //console.log('mystore@stores> ERROR: ' + require('util').inspect(e, true, 99, true));     // uncomment to debug errors.
    return callback( false );   // must return.
  }
};

// set the worker config, or call a json config file via require.
var config = {
  "name": "mystore",
  "encoding": "utf8"
};
exports.config = config;    // must export the config so kurunt can read it.
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
Store your now 'schemed' messages any way you want. In your favorite database, filesystem, search engine, or don't store your messages but 'stream' them, stream api (default), socket.io.

#### Stream Report
You can visualize your data from within the [web admin](http://127.0.0.1:8888) 'report' (requires socket.io to be installed > npm install socket.io). See the messages live as they come in, pause/play messages for analysing. 

#### Why do all of this?
The simplest answer is for efficiency. There is a limit to how much "message processing" a single node.js process can do. You'll eventually need more processes and to be fault-tolerant more machines.


## Performance

#### Benchmark

You can benchmark Kurunt by running (can set config.json:logging = "benchmark"): 
```
node examples/benchmark/benchmark.js
```
To simulate messages (using perl):
```
perl examples/benchmark/benchmark.pl -T=tcp -P=7001 -m=10 -c=10
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -help for more info.  

You can then view the processed messages through the [stream report](http://127.0.0.1:9001/).

#### Results

Results depend a little bit on what you mean by "event processing", I mean it to be a single event from ingestion (input) to worker (test) to store (stream) - around 20,000 (upto 50,000) event per second on a single machine to fully process with a sub 1 second latency. It can ingest (input) data much faster in the 100,000s messages per second. The topology you set will determine performance.

Tuple testing: Sending 100 tuples (comma separated values: A,B,C,...) in each event, I get in-excess of 10,000 (peeking at 20,000) event per second * 100 tuples extracted = 1,000,000 tuples per second, processed.


## License

Choose either: [MIT](http://opensource.org/licenses/MIT) or [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

