# Kurunt TCP Input

TCP input server for Kurunt. Can ingest data using the TCP protocol from trusted sources, varified by the datas' apikey (_port_ field for TCP input).

Will open data inputs found in the ../../data.json file on the _port_ field.

## Clients

#### Send Data

See _client.pl_ file to send this 'worker' data.

```
> perl /kurunt/lib/workers/test/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='hello world'
```
Can set options: -m = number of messages to send per second, -c = number of seconds to send messages, -d = the string data you want to send. -help for more info.

#### Arduino Sensors

See _/clients/arduino/arduino.ino_ file. Can send data from Arduino if it's connected to the Internet/Network using the [Arduino Eithernet module](http://arduino.cc/en/reference/ethernet), using JSON format. Will need a 'data' open with JSON 'worker'.

#### Twitter API (Firehose)

See _/clients/twitter/index.js_ file, need to rename */clients/twitter/_keys.json* to _/clients/twitter/keys.json_ and set fields within.

## config.json

See _config.json_ file to set options.

```js
{
	"name": "tcp",
	"description": "TCP server input.",
	"bands": 100,
	"band": 1,
	"messenger_codec": "json",
	"message_delineate": 10,
	"message_buffer_limit": 10485760,
	"debug": "benchmarking",
	"mq_nodelay": false
}

```

