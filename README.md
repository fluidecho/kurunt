## Kurunt

Kurunt is a distributed message processing framework for real-time data.  

Can be used for real-time analytics, applications, ETL. Is's easy to get started no coding required. 

### Features

- Streaming system, processing messages in real-time.
- Implemented in 100% Javascript for Node.js.
- Scalable across machines or on a single cpu, from BeagleBone to the cloud.
- Fault taulerant message delivery, can be setup with no single point of failure.
- Uses zeromq like message patterns for processing.
- No coding required, has a web admin or can code your own inputs, workers, stores.
- Supports any data type and format, json, ascii, binary, etc.
- Can be used as a Node.js module or run stand-alone.

### Installation

Requires [Node.js](http://nodejs.org/).

```js
npm install -g kurunt
```

### Use

To launch Kurunt, from your terminal:

```
kurunt
```

Then to administer can open your browser at:

```
http://localhost:8888
```

### As a module

```js
var kurunt = require('kurunt');
...
```

### License

Choose either:  
[MIT] (http://opensource.org/licenses/MIT).  
[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

