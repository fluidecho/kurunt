# Soci #

TCP server witen in Node.js for syslog and other TCP clients - and acompning client scripts writen in Perl. Soci can be used in conjunction with Kurunt.

The soci client perl scripts act as your data collectors using syslog in your operating system to forward messages to soci server.

Soci server stores the incomming messages in a message queue (using ZeroMQ) for collection, for example by Kurunt. 

**soci** = **soc** (socket) **i** (input).

## License ##

Soci is a open source project under [Apache License](http://www.apache.org/licenses/LICENSE-2.0). See [LICENSE](LICENSE) file.

## Authors ##

Mark Ashcroft - _mark@kurunt.com_

## Configuration for soci server ##

See file [config.json](config.json) file.

**send\_socket\_port** is the port number for soci server to put messages (using ZeroMQ).

## Installation ##

### Dependencies ###

- git (eg: apt-get install git git-core)

### Dependencies for soci server ###

- Node.js
- ZeroMQ

### Dependencies for soci clients ###

- syslog or rsyslog or syslog-ng (for syslog)
- Perl

### Install ###

Installation is quite simple as soci is a collection of scripts so it should run in any directory you copy it to - i like _opt_.

	cd /opt
	git clone git@github.com:markcode/soci.git

Soci will now be installed into _/opt/soci_, client script into _/opt/soci/clients_ - if you're installing soci as part of Kurunt the path becomes: _/opt/kurunt/soci_	

The client script writen in perl will need to be made executable before they will work.

	chmod +x access_syslog
	chmod +x tail_syslog.pl
	
Also if the perl script fail you may need to change the shebang line within the scripts from _#!/usr/bin/perl_ to _#!/usr/local/bin/perl_ or where ever perl is installed in your system.

#### Make soci executable ####

	cp /opt/soci/soci /etc/init.d/soci
	chmod 0755 /etc/init.d/soci
	
No soci can now be launched like a daemon

	/etc/init.d/soci start
	/etc/init.d/soci stop
	/etc/init.d/soci restart

## Collecting Data for Sending to Soci Server ##

In these examples you'll need to change the address and port, eg _ec2-101-234-195-123.compute-1.amazonaws.com:9333_ to the actual address and port for soci server.

If you're using Kurunt you'll need to open a data input for soci server to recieve the syslog messages. Login to your Kurunt admin - data inputs - add new TCP server - copy the address.
	
Now you need to have syslog forward these messages to soci server - you'll need to replace the address and port, eg _ec2-101-234-195-123.compute-1.amazonaws.com:9333_ - the @@ means TCP as aposed to @ for UDP (not supported by soci server) - the _local2_ matches what's in your perl client script.

These instructions are for Ubuntu and may be different for other systems. Ubuntu comes standard with **rsyslog** which is also found in: Fedora, openSUSE, Debian, Red Hat, Solaris, FreeBSD.

For addition instructions on rsyslog: [_Reliable Forwarding of syslog Messages with Rsyslog_](http://www.rsyslog.com/doc/rsyslog_reliable_forwarding.html).

### syslog tip ###

Once you've got your syslog setup complete you can test it using the **logger** command, eg:

	logger -p local2.notice hello world


###  Apache web server access logs ###

You can use the CustomLog command within the apache config file. This will call perl script _clients/apache\_syslog_ 

	vi /etc/apache2/sites-available/default
	
Add the following line somewhere within _&lt;VirtualHost *:80&gt;_. Depending on your system and setup you may need to play arround with the script execution line - [a detailed article](http://www.oreillynet.com/pub/a/sysadmin/2006/10/12/httpd-syslog.html) explains more.
	
	CustomLog "|perl /opt/soci/clients/apache_syslog" combined
	
Configure syslog.

	vi /etc/rsyslog.conf

And insert.

	local2.* @@ec2-101-234-195-123.compute-1.amazonaws.com:9333
	
Syslog groups duplicate messages, if you want every single message (log) to be sent individually, can also set these.

	$RepeatedMsgContainsOriginalMsg off
	$RepeatedMsgReduction off
	
Restart syslog and apache so changes take effect.

	service rsyslog stop
	service rsyslog start
	/etc/init.d/apache2 restart
	
###  Ningx web server access logs ###

Unfortunatly ningx does not have a _CustomLog_ option, although there is a [patch](http://wiki.nginx.org/HttpLogModule) for it and it may become a standard feature in future releases. So tailing the _/var/log/ningx/access.log_ file and send the messages to syslog for forwarding.

Configure syslog.

	vi /etc/rsyslog.conf
	
And insert.

	local2.* @@ec2-101-234-195-123.compute-1.amazonaws.com:9333
	
Syslog groups duplicate messages, if you want every single message (log) to be sent individually, can also set these.

	$RepeatedMsgContainsOriginalMsg off
	$RepeatedMsgReduction off
	
Restart syslog and apache so changes take effect.

	service rsyslog stop
	service rsyslog start
	service nginx restart

Now you can start tailing the access.log file.
	
	perl /opt/soci/clients/tail_syslog.pl
	

###  syslog events ###

To capture all messages sent to syslog.

	vi /etc/rsyslog.conf

And insert.

	*.* @@ec2-101-234-195-123.compute-1.amazonaws.com:9333
	
Restart syslog so changes take effect.

	service rsyslog stop
	service rsyslog start	
	
###  Tail a file ###

Similar to the ningx example you can tail any file and have the events sent to syslog for forwarding.

Configure syslog.

	vi /etc/rsyslog.conf
	
And insert.

	local2.* @@ec2-101-234-195-123.compute-1.amazonaws.com:9333
	
Syslog groups duplicate messages, if you want every single message to be sent individually, can also set these.

	$RepeatedMsgContainsOriginalMsg off
	$RepeatedMsgReduction off
	
Restart syslog and apache so changes take effect.

	service rsyslog stop
	service rsyslog start
	/etc/init.d/apache2 restart

Edit the perl script and set the file you wish to tail.

	vi /opt/soci/clients/tail_syslog.pl
		
Example for ningx access.log file.
		
	my $file_to_tail = "/var/log/ningx/access.log";
		
Now you can start tailing the file.
	
	perl /opt/soci/clients/tail_syslog.pl
	
	
## Collecting Data Alternatives to Soci Server ##

- **webi**: which is a HTTP based API.
- **pixi**: a web pixel server, like used by Google Analytics.
- **ZeroMQ**: because Kurunt uses ZeroMQ you could connect directly using sockets (example solution not yet avaliable - contact us for more info).
	
## TODO ##

- TLS (SSL) encrytion for rsyslog sending and for soci server.

## Change Log ##

- 8 March 2012: version 0.1
