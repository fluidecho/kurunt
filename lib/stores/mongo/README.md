# MongoDB Store

MongoDB Store for Kurunt.  

You will require the mongodb node.js module installed.
```
npm install mongodb -g
```
Can install locally within kurunt or globally using -g command.

## Some useful mongo commands

Launch mongo cli.
```
mongo
```

Show databases.
```
show dbs
```

Use database "kurunt".
```
use kurunt
```

Show collections within database.
```
show collections
```

Show records within "test" collection.
```
db.test.find()
```

Show pretty formated records within "test" collection.
```
db.test.find().pretty()
```

Count records within "test" collection.
```
db.test.count()
```

Delete database selected (careful!!!).
```
db.dropDatabase()
```

