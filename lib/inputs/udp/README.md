# Kurunt UDP Input

## Performance Note

The UDP protocol is designed for performance not reliable delivery. If reliable delivery is important to you, use the TCP input, which guarantees deliver.  

During benchmarking the UDP input will loose messages. For example:

```
/kurunt/lib/workers/string$ perl client.pl -T=udp -P=7001 -m=10000 -c=10 -d=''
```
This should send and process 100,000 messages, however only around 40,000 to 50,000 messages actually get processed. Under smaller loads all messages get processed. However using the TCP input, all messages get processed.  

Because the UDP protocol sends/receives one message at a time it actually performs slower than the TCP input under load because the TCP protocol uses batching.
