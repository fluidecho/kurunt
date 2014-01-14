# Kurunt Test Worker

Use this 'worker' for testing and benchmarking Kurunt. Is a simple toString 'worker', will accept any string data sent, EG: "hello world" and set within the 'text' schema attribute.  

You can test/benchmark Kurunt by opening the 'test' data, using the [web admin](http://localhost:8888), or manually by adding this to the _../../data.json_ file:

```js
{
	"data": [
		{ "apikey": "5555", "input": "tcp", "worker": "test", "stores": ["stream"], "reports": ["stream"], "tags": ["test", "text", "string"], "host": "127.0.0.1", "port": 5555, "status": "open" }
	]
}
```
Then sending data using:
```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Note, that the port number must be matching, IE: 5555 in both.

## index.js

See _index.js_ file to see how a simple 'worker' works.

```js
// must export 'work' module.
module.exports.work = function (message, config, fn, callback) {

  // 'message.message' Format: string
  // Sample: "hello world"
  //
  // See: http://docs.kurunt.com/worker/test/

  //console.log('MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
    // (1) convert the incoming message.message from buffer to string (text).
    var string = message.message.toString(config['encoding']);    // "hello world" or whatever sent.
    
    // (2) add string value to this attribute, which get's added to this messages: stores: schema.
    var attributes = [];
    attributes['text'] = string;    // "hello world" or whatever sent.

    // (3) return processed message (required) and attributes (optional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
  console.log('error> ' + require('util').inspect(e, true, 99, true));
    callback(false);
    return false;
  }

};

```

## config

See _config_ to set options like message encoding and set the 'schema' for the message which can be used by the 'store'.

```js
{
	"name": "test",
	"title": "Test",
	"description": "Test 'worker' for Kurunt, processing string data.",
	"icon": "",
	"url": "http://docs.kurunt.com/worker/test/",
	"version": 0.2,	
	"date_mod": "10/22/2013",
	"inputs": [ "tcp" ],
	"mq_nodelay": false,
	"reports": [ "stream" ],
	"message_codec": "json",
	"encoding": "utf8",
	"stores": [
		{
			"stream": {
				"schema": [
					{
						"name": "text"
					}
				]
			}
		}	
	]
}

```

## Send Data

See _client.pl_ file to send this 'worker' data.

```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.  

Why use Perl and not Node.js to send data? Because we're benchmarking Kurunts (& node.js) performance at __processing__ data, not at sending data.

