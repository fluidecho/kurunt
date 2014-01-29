# Redis Store

Redis Store for Kurunt.  

You will require the redis node.js module installed.
```
npm install redis -g
```
Can install locally within kurunt or globally using -g command.

## Some useful redis commands

Launch redis cli.
```
redis-cli
```

Show all keys.
```
keys *
```

Show record within key "mykey".
```
get mykey
```

Delete all keys (careful!!!).
```
FLUSHDB       // Removes data from your connection's CURRENT database.
FLUSHALL      // Removes data from ALL databases.
```

