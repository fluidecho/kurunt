#!/usr/bin/perl -s
#
# Test (worker) Client for Kurunt (sending via TCP or UDP).
#
# /kurunt/lib/workers/test
#

use IO::Socket::INET;


print "--- Test Client for Kurunt ---\n\n";

# get command line settings: -m = number of messages, -c = cycles to run of messages, -P = port number.
# -h, help options.
if ( $h ne '' || $help ne '' ) {
	print "Use these commands to run script:\n";
	print "   -T = tcp|udp (list, optional command, transport protocol tcp or udp to Kurunt's input)\n";
	print "   -P = 6666 (number, required command, port number to Kurunt tcp or udp input port)\n";
	print "   -H = 127.0.0.1 (ip address, optional command, ip address to Kurunt tcp or udp input host)\n";
	print "   -m = 100 (number, required command, of messages to send)\n";
	print "   -c = 10 (number, required command, of cycles to send messages)\n\n";
	print "For example> perl client.pl -T=tcp -P=6666 -m=100 -c=10\n";
	print "This example would send 100 messages every second for 10 seconds through port 6666, -H (host).\n";
	exit(0);
}
if ( $P eq '' ) {
	die "ERROR need -T = transport protocol, -P = port number, -m = number of messages and -c = cycles, commands. For help> perl client.pl -h\n";
}
if ( $m eq '' ) {
	die "ERROR need -T = transport protocol, -P = port number, -m = number of messages and -c = cycles, commands. For help> perl client.pl -h\n";
}
if ( $c eq '' ) {
	die "ERROR need -T = transport protocol, -P = port number, -m = number of messages and -c = cycles, commands. For help> perl client.pl -h\n";
}
my $total = $m * $c;
if ( $total == 0 ) {
	die "ERROR need -T = transport protocol, -P = port number, -m = number of messages and -c = cycles, commands. For help> perl client.pl -h\n";
}



# flush after every write
$| = 1;

# tcp by default, else udp by selection.
if ( $T eq '' ) {
	$T = 'tcp';
}

if ( $H eq '' ) {
	$H = '127.0.0.1';
}
my ($socket,$client_socket);
$socket = new IO::Socket::INET (
PeerHost => $H,
PeerPort => $P,
Proto => 'tcp',
) or die "ERROR in Socket Creation : $!\n";

print "TCP Connection Success.\n";
print "Sending $m Messages for $c Cycles, $total Total.\n";


my @images = ();	# add a range of images.
my $range = 3;		# how many random images (3 default).

# binary (jpeg image file) to use as message. 
open FILE1, "images/1.jpeg" or die $!;
binmode(FILE1);
my $raw_string = do{ local $/ = undef; <FILE1>; };
my $pic = encode_base64( $raw_string );
$pic =~ s/\n//g;	# remove base64 LFs, so can deliniate each message by LF within /inputs/tcp

push(@images, $pic); 

open FILE2, "images/2.jpeg" or die $!;
binmode(FILE2);

$raw_string = do{ local $/ = undef; <FILE2>; };
$pic = encode_base64( $raw_string );
$pic =~ s/\n//g;	# remove base64 LFs, so can deliniate each message by LF within /inputs/tcp

push(@images, $pic); 

open FILE3, "images/3.jpeg" or die $!;
binmode(FILE3);

$raw_string = do{ local $/ = undef; <FILE3>; };
$pic = encode_base64( $raw_string );
$pic =~ s/\n//g;	# remove base64 LFs, so can deliniate each message by LF within /inputs/tcp

push(@images, $pic); 

#use bytes;
#print "size: " . length($encoded) . "\n";


my $tot = 0;

my $i = 1;	# id sequential number.
my $cycle = 0;
for ( $cycle = 1; $cycle <= $c; $cycle++ ) {

	my $x = 1;
	for ( $x = 1; $x <= $m; $x++ ) {

		if ( $x == $m ) {
			break;
		}

		my $ran = int(rand($range));	# randomly send one of three images.
		
		print $socket $images[$ran] . "\n";		# send message to tcp server.
		
		$i++;
	}

	print "Finished sending messages for cycle " . $cycle . "\n";
	sleep (1);						# pause for one second before sending next cycle of messages.
}

print "Finished sending all cycles and messages! Good-bye.\n";

sleep (1);							# pause for 1 second before closing connection, dont forget to - 1 second from benchmarking results!
$socket->close();

exit(0);


