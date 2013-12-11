# Kurunt Syslog Worker

This is a syslog worker for rsyslog format.  

### Setup

To edit rsyslog config file with your favourate editor (vi, nano):
```
sudo nano /etc/rsyslog.conf
```
Add remote log forwarding using Kurunt's TCP input:
```
*.* @@127.0.0.1:6001
```
Add remote log forwarding using Kurunt's UDP input:
```
*.* @127.0.0.1:6001
```
To restart rsyslog (Ubuntu).
```
sudo service rsyslog restart
```
To test syslog, can send a log message.
```
logger -i -t test "mary had a little lamb"
```
