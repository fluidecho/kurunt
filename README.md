# Kurunt

Kurunt is a distributed message processing framework for real-time data.  

Can be used for real-time analytics, applications, ETL. It's easy to get started no coding required.

## Features

- Streaming system, processing messages in real-time.
- Implemented in 100% Javascript for Node.js.
- Scalable across machines or on a single cpu, from BeagleBone to the cloud.
- Fault tolerant message delivery, can be setup with no single point of failure.
- Uses zeromq like message patterns for processing.
- No coding required, has a web admin or can code your own inputs, workers, stores.
- Supports any data type and format, json, ascii, binary, etc.
- Uniquely id's messages sequentially and in nanosecond format.
- Can be used as a Node.js module or run stand-alone.
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

```
         *****************
         *   YOUR DATA   *
         *****************
                 |
                 v
            ***********
            *  INPUT  *
            ***********
               |   |
       +-------+   +-------+
       |                   |
       v                   v
  **********          **********
  * WORKER *          * WORKER *
  **********          **********
       |                   |
       +-------+   +-------+
               |   |
               v   v
            ***********
            *  STORE  *
            ***********
```
Above shows how the message (your data) is processed, this is the 'out-of-the-box' solution, you can however create all sorts of topology patterns for scalability and fault-tolerance.

#### Your Data
Could be nearly anything, like: json, web, jpeg, csv, syslog, access_log, tail a file, arduino sensors, clickstream, twitter firehose, etc.

#### Inputs
Kurunt opens inputs to your data using: TCP, UDP or HTTP.

#### Workers
Process the messages any way you want. Turn structured, semi-structured or unstructured data into something that you can use. Some are easy like: json, msgpack - or something like regex a access_log, filter an image, etc. It's easy to build your own workers in just a few lines of Javascript. 

#### Stores
Store your now 'schemed' messages any way you want. In your favorite database, filesystem, or don't store your messages but 'stream' them, stream api (default), socket.io.

#### Stream Report
You can visualize your data from within the [web admin](http://localhost:8888) 'stream' report (requires socket.io to be installed > npm install socket.io). See the messages live as they come in, pause/play messages for analysing. 

## Performance

You can benchmark Kurunt by opening the 'test' data, using the [web admin](http://localhost:8888). And run the data simulation client.
```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.

#### Results

Results depend a little bit on what you mean by 'message processing', I mean it to be from ingestion (input) to worker (test) to store (stream) - around 30,000 (upto 50,000) messages per second on a single machine to fully process with a sub 1 second latency. It can ingest (input) data much faster in the 100,000s messages per second. It will also depend on the amount of work you are getting your 'worker' to do, JSON.parse is much faster than RegExp for example. The topology you set will also determin performance.

## Module

```js
var kurunt = require('kurunt');
...
```

## License

Choose either: [MIT] (http://opensource.org/licenses/MIT) or [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

