# Deploying Kurunt on AWS EC2

## Setup EC2

These instructions are for using Ubuntu 12.04 LTS.

Open ports in security group, port 22 so can ssh into instance. You will also need to optionally open ports for the following (if required).  

```
8888     # Web admin (default port).
9001     # Stram report.
5555     # http input stream (if inputing data from external sources).
3333     # api output.
6001+    # tcp/udp input stream (from web admin, as set by their apikey, if inputting data from external sources).
7001+    # tcp/udp input stream (from asmodule, as set by their apikey, if inputting data from external sources).

```
Kurunt uses axon for its message processing, if you have setup kurunt to run across multiple machines you will need to set your topology.json, if any of these machines are outside of the AWS security group you will need to open those ports accordingly.  

After creating instance.  

Log into instance, using your instances public dns address:
```
ssh -i ec2.pem ubuntu@ec2-54-234-30-169.compute-1.amazonaws.com
```

## Run install script

You can run the install script which will automatically install Kurunt and dependencies.  

(WARNING: USE THIS AT OWN RISK!) May need to use sudo or as sudo su.
```
wget -q https://raw2.github.com/kurunt/kurunt/master/deploy/ec2/install.sh
chmod 0755 install.sh
./install.sh
```

### Commands (install manually):

For root access.
```
sudo su
```

Update.
```
apt-get -y update && apt-get upgrade
```

Install node.js.
```
apt-get install -y python-software-properties python g++ make
add-apt-repository ppa:chris-lea/node.js
apt-get update
apt-get install nodejs
```

Install kurunt.
```
npm install -g kurunt
```

If installing globally will install in the following location.
```
/usr/lib/node_modules/kurunt
```
CLI will be linked as.
```
/usr/bin/kurunt -> /usr/lib/node_modules/kurunt/bin/cli.js
```

## Benchmarking

Tested again a single c3.large (2 cores) instance, good at around 15,000 mps.


## Notes

### top
When benchmarking to view load on each cpu.
```
top
```
Then enter.
```
1
```

