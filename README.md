## Kurunt

Kurunt is a scalable message processing framework for real-time analytics, applications and E.T.L.  

Can scale message processing horizontally across numerous processes and servers. Designed with zeromq message patterns to meet the demands of high concurrency with low latency, from inputs to schema-ing to db storage and visualizations.  

Some things to know about Kurunt:  
- can scale out to many processes and servers.  
- implemented in pure node javascript.  
- is a streaming system, for real-time data.  
- fault taulerant message delivery.  
- guaranteed message delivery.  
- does not use a db, all data is processed in-memory.  
- uses zeromq (axon) message patterns for processing.  
- is a framework, use existing or build your own inputs, workers, stores, etc  
- use your favourate storage solution: mongodb, redis, cassandra, mysql, solr, sphinx (search) etc.  
- the 'message' can be any form of data: ascii, binary.  
- the 'message' can be from any source: syslog, tail, events, web pixel, sensors, social media, images, etc.  

### Installation

```js
npm install -g kurunt
```

### Use

To launch Kurunt, from your terminal enter:

```
kurunt
```

Then to administer can open your browser at:

```
http://localhost:8888
```

### Example

```js
var kurunt = require('kurunt').init(); // initiate the Kurunt aplication.

kurunt.send('hello,world', function (msg) {
	console.log("%j", msg); // processed message.
});
```

### Module API

Kurunt is made up of three components: inputs, schemas and stores.  

- Inputs: TCP server, acepting data 'messages' for processing.  
- Workers: This is where all the data 'message' processing occurs.  
- Stores: This is where the message is stored or presented.  

Data is then sent into the Input, to the Worker for processing, then finally to the Store.  

```
kurunt.send(address, eventid, message, callback function)

```
Example:

```js
var Kurunt = require('kurunt');
var config = require('config.json');
var data = require('data.json');
var topology = require('topology.json');
var kurunt = new Kurunt(config, data, topology); // initiate the Kurunt aplication.

var message = 'hello, world';
kurunt.send('tcp://127.0.0.1:3055', 'test', message, function (err, msg) {
  if ( err ) {
    throw new Error(err.message);
  }
  console.log(require('util').inspect(msg, true, 99, true)); // processed message.
});
```

### License

Choose either:  
[MIT] (http://opensource.org/licenses/MIT).  
[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

