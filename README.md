# Kurunt

Kurunt, real-time processing of streaming data at any scale, using node.js.

Can be used to capture, process and store both big and small data. Useful for real-time: analytics, applications, ETL and time series data. Has been build to be efficient and fast, benchmarked at processing over a million tuples per second per node. Simple to use through its web admin.

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

## Installation

From your terminal, requires [node.js](http://nodejs.org/).

```js
npm install -g kurunt
```

## Use

To launch Kurunt, from your terminal:

```
kurunt
```

Then to administer can open your browser at:

```
http://localhost:8888
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
          *  STORE  *  (stream, socket.io, mongo, mysql, redis, S3, solr, sphinx, etc)
          ***********
</pre>

Above shows how the message (your data) is processed using the default topology, you can however create all sorts of patterns for scalability and fault-tolerance.

#### Your Data
Could be nearly anything, like: json, syslog, access_log, web, jpeg, csv, msgpack, tail a file, arduino sensors, clickstream, twitter firehose, etc.

#### Inputs
Kurunt opens inputs to your data using: TCP, UDP or HTTP.

#### Workers
Process the messages any way you want. Turn structured, semi-structured or unstructured data into something that you can use. Use functions, parse, regex, filter, augment, geoip, etc. Use an existing worker, or it's easy to build your own custom workers in just a few lines of Javascript. 

#### Stores
Store your now 'schemed' messages any way you want. In your favorite database, filesystem, or don't store your messages but 'stream' them, stream api (default), socket.io.

#### Stream Report
You can visualize your data from within the [web admin](http://localhost:8888) 'report' (requires socket.io to be installed > npm install socket.io). See the messages live as they come in, pause/play messages for analysing. 

#### Why do all of this?
The simplest answer is for efficiency. There is a limit to how much 'processing' a single node.js process can do. You'll eventually need more processes and to be fault-tolerant more machines.

## Performance

#### Benchmark

You can benchmark Kurunt by opening a 'stream', using the [web admin](http://localhost:8888). And run the data simulation client.
```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.

#### Results

Results depend a little bit on what you mean by "message processing", I mean it to be a single message from ingestion (input) to worker (test) to store (stream) - around 20,000 (upto 50,000) messages per second on a single machine to fully process with a sub 1 second latency. It can ingest (input) data much faster in the 100,000s messages per second. The topology you set will determine performance.

Tuple testing: Sending 100 tuples (comma separated values: A,B,C,...) in each message, I get in-excess of 10,000 (peeking at 16,000) messages per second * 100 tuples extracted = 1,000,000 tuples per second, processed.

## Module

```js
var kurunt = require('kurunt');
...
```

## License

Choose either: [MIT] (http://opensource.org/licenses/MIT) or [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

