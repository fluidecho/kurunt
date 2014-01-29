# MySQL Store

MySQL Store for Kurunt.  

You will require the mysql node.js module installed.
```
npm install mysql -g
```
Can install locally within kurunt or globally using -g command.  

## Some useful MySQL commands

Launch mysql cli.
```
mysql -u root -p
```

Show databases.
```
show databases;
```

Use database "kurunt".
```
use kurunt;
```

Show tables within database.
```
show tables;
```

Describe a table "test".
```
describe test;
```

Show last 10 records.
```
select * from test order by id desc limit 10;
```

Delete database "kurunt" (careful!!!).
```
drop database kurunt;
```

