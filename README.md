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
-----------------
|~~~YOUR DATA~~~|
-----------------
        |
        V
     [INPUT]
      /   \
     V     V 
[WORKER][WORKER]
     \     /
      V   V
     [STORE]
```
Above shows how the message is processed, this is the 'out-of-the-box' solution, you can however create all sorts of patterns for scalability and fault-tolerance.

#### YOUR DATA
Could be nearly anything, like: csv, json, web, jpeg, syslog, access_log, tail a file, arduino sensors, twitter firehose, etc.

#### INPUTS
Kurunt opens inputs to your data using: TCP, UDP or HTTP.

#### WORKERS
Process the messages any way you want. Turn structured, semi-structured or unstructured data into something that you can use. Some are easy like: json, msgpack - or something like regex a access_log, filter a image, etc. It's easy to build your own workers in just a few lines of Javascript. 

#### STORES
Store your messages any way you want. In your favorite database, filesystem, stream api (default), socket.io.

## Performance

You can benchmark Kurunt by opening the 'test' data, using the [web admin](http://localhost:8888). And run the data simulation client.
```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.

#### Results

Results depend a little bit on what you mean by 'message processing', I mean it to be from ingestion (input) to worker (test) to store (stream) - around 50,000 messages per second on a single machine to fully process with a sub 1 second latency. It can ingest (input) data much faster in the 100,000s messages per second. It will also depend a lot on the amount of work you are getting your 'worker' to do, JSON.parse is much faster than RegExp for example. 

## Module

```js
var kurunt = require('kurunt');
...
```

## License

Choose either:  
[MIT] (http://opensource.org/licenses/MIT).  
[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

