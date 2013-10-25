# Kurunt JSON Worker

JSON worker for Kurunt, processing json formated data.

```js
{
  "data": [
    { "apikey": 5555, "input": { "object": "tcp", "id": 0 }, "worker": "json", "stores": ["stream"], "reports": ["stream"], "tags": [], "status": "open", "access_hosts": [""] }
  ]
}
```
Then sending data using:
```
> perl /kurunt/lib/workers/json/client.pl -T=tcp -P=5555 -m=1 -c=1 -d='{"hello": "world"}'
```

