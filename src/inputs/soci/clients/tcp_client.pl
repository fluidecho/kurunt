#!/usr/bin/perl

#
# Be sure to make this script executable!
# eg> chmod +x tail_syslog.pl
#

# To use: "perl tcp_client.pl" then type message then hit enter/return key.

use IO::Socket;

# if need dns lookup of host.
#my $remote_host = inet_ntoa(inet_aton("www.yahoo.com"))
#	or die "Can't resolve host address: $!";

my $remote_host = '127.0.0.1';		# change to remote address of soci server.
my $remote_port = 9333;				# change to remote port of soci server.

my $socket = IO::Socket::INET->new(PeerAddr => $remote_host,
                                PeerPort => $remote_port,
                                Proto    => "tcp",
                                Type     => SOCK_STREAM)
    or die "Couldn't connect to soci server at $remote_host:$remote_port : $@\n";

# enter a message.
print "Enter your message: ";
chomp (my $message = <STDIN>);

# send the message.
print $socket $message . "\n";

my $answer = <$socket>;

# close the connection when we're done.
close($socket);
