#!/usr/local/bin/perl -w
use LWP::UserAgent;

my $myurl = "http://127.0.0.1:5555/12345/";
my $ua = new LWP::UserAgent; $ua->agent("$0/0.1 " . $ua->agent);
$ua->agent("Mozilla/8.0");

# pretend we are very capable browser
my $req = new HTTP::Request 'GET' => "$myurl";
$req->header('Accept' => 'text/html');

# send request 
my $res = $ua->request($req);

# send request 
my $res2 = $ua->request($req);

# check the outcome 
if ($res->is_success) {
	print $res->content;
	#All this means is you got some html back . . .
} else {
	print "Error: " . $res->status_line . "\n";
}



# check the outcome 
if ($res2->is_success) {
	print $res2->content;
	#All this means is you got some html back . . .
} else {
	print "Error: " . $res2->status_line . "\n";
}
