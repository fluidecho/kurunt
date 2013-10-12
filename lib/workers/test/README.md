## Kurunt Test Worker

#### index.js

See _index.js_ file to see how a simple 'worker' works.

```js
// must export 'process' module.
module.exports.process = function (message, config, fn, callback) {

  // 'message.message' Format: string
  // Sample: "hello world"
  //
  // See: http://docs.kurunt.com/worker/test/

  console.log('MESSAGE> ' + require('util').inspect(message, true, 99, true));    // uncomment to debug message.

  // use try catch so can skip over invalid messages.
  try {
  
    // (1) convert the incomming message.message from buffer to string (text).
    var string = message.message.toString(config['encoding']);    // "hello world" or whatever sent.
    
    // (2) add string value to this attribute, which get's added to this messages: stores: schema.
    var attributes = [];
    attributes['text'] = string;    // "hello world" or whatever sent.

    // (3) return processed message (required) and attributes (otional, set manually within message otherwise) back to kurunt.
    return callback( [ message, attributes ] );
  
  } catch(e) {
  console.log('error> ' + require('util').inspect(e, true, 99, true));
    callback(false);
    return false;
  }

};

```

#### config.json

See _config.json_ file to set options like message encoding and set the 'schema' for the message which can be used by the 'store'.

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

#### Send Data

See _client.pl_ file to send this 'worker' data.

```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.

