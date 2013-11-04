# Kurunt

Kurunt is a distributed message processing framework for real-time data using node.js.  

Can be used to capture, process and store both big and small data. Useful for real-time analytics, applications, ETL.  

It's easy to get started using the web admin.

### *** UNDER DEV, COMING SOON (star me if interested) ***

## Features

- Streaming system, processing messages in real-time.
- Implemented in 100% javascript for node.js.
- Scalable across machines or on a single cpu, from BeagleBone to the cloud.
- Supports any data type and format, json, ascii, binary, etc.
- Fault tolerant message delivery, can be setup with no single point of failure.
- Uses zeromq like (axon) message patterns for processing.
- Uniquely id's messages sequentially and in nanosecond format.
- Can be used as a node.js module or run stand-alone.
- Built to be fast and efficient.

## Installation

Requires [Node.js](http://nodejs.org/).

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
* WORKER *          * WORKER *  (JSON.parse, RegExp, split, filter, etc)
**********          **********
     |                   |
     +-------+   +-------+
             |   |
             v   v
          ***********
          *  STORE  *  (stream, socket.io, mongo, mysql, redis, S3, solr, sphinx, etc)
          ***********
</pre>

Above shows how the message (your data) is processed, this is the 'out-of-the-box' topology, you can however create all sorts of patterns for scalability and fault-tolerance. Some of the 'worker' and 'store' actions shown require you coding or use community submitted modules.

#### Your Data
Could be nearly anything, like: json, syslog, access_log, web, jpeg, csv, msgpack, tail a file, arduino sensors, clickstream, twitter firehose, etc.

#### Inputs
Kurunt opens inputs to your data using: TCP, UDP or HTTP.

#### Workers
Process the messages any way you want. Turn structured, semi-structured or unstructured data into something that you can use. Some are easy like: json, msgpack - or something like regex a access_log line, filter an image, etc. It's easy to build your own workers in just a few lines of Javascript. 

#### Stores
Store your now 'schemed' messages any way you want. In your favorite database, filesystem, or don't store your messages but 'stream' them, stream api (default), socket.io.

#### Stream Report
You can visualize your data from within the [web admin](http://localhost:8888) 'stream' report (requires socket.io to be installed > npm install socket.io). See the messages live as they come in, pause/play messages for analysing. 

#### Why do all of this?
The Simplest answer is for efficiency. There is a limit to how much 'processing' a single Node.js process can do. You'll eventually need more processes and to be fault-tolerant more machines.

## Performance

#### Benchmark

You can benchmark Kurunt by opening the 'test' data, using the [web admin](http://localhost:8888). And run the data simulation client.
```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.

#### Results

Results depend a little bit on what you mean by "message processing", I mean it to be from ingestion (input) to worker (test) to store (stream) - around 30,000 (upto 50,000) messages per second on a single machine to fully process with a sub 1 second latency. It can ingest (input) data much faster in the 100,000s messages per second. It will also depend on the amount of work you are getting your 'worker' to do, JSON.parse is faster than RegExp for example. The topology you set will also determine performance.

Tuple testing: Sending 100 tuples (comma separated values: A,B,C,...) in each message, I get in-excess of 10,000 (peeking at 16,000) messages per second * 100 tuples extracted = 1,000,000 tuples per second, processed.

## Module

```js
var kurunt = require('kurunt');
...
```

## License

Choose either: [MIT] (http://opensource.org/licenses/MIT) or [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

