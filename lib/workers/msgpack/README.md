# Kurunt MessagePack Worker

MessagePack worker for Kurunt, processing msgpack formated data.

```js
{
  "data": [
    { "apikey": 5555, "input": { "object": "tcp", "id": 0 }, "worker": "msgpack", "stores": ["stream"], "reports": ["stream"], "tags": [], "status": "open", "access_hosts": [""] }
  ]
}
```
Then sending data using:
```
> perl /kurunt/lib/workers/msgpack/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='{"hello": "world"}'
```

