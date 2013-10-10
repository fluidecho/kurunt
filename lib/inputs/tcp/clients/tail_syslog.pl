#!/usr/bin/perl

#
# Be sure to make this script executable!
# eg> chmod +x tail_syslog.pl
#

use Sys::Syslog;

my $file_to_tail = "/var/log/ningx/access.log";

open my $pipe, "-|", "/usr/bin/tail", "-f", $file_to_tail or die "could not start tail file: $!";

my $SERVER_NAME = shift || 'tail-log';
my $FACILITY = 'local2';
my $PRIORITY = 'info';
my $log = '';

Sys::Syslog::setlogsock('unix');
openlog ($SERVER_NAME, 'ndelay', $FACILITY);
while ($log = <$pipe>) {
    chomp($log);
    syslog($PRIORITY, $log);
}
closelog