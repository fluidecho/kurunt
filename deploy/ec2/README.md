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
sudo wget -q https://raw2.github.com/kurunt/kurunt/master/deploy/ec2/install.sh
sudo chmod 0755 install.sh
sudo ./install.sh
```

## Deploy using Juju

I plan to add a Charm so Kurunt can be deployed on AWS via [Juju](https://juju.ubuntu.com/).


## Optional dependencies installations

You may optionally wish to install storage solutions for kurunt stores, such as: mongodb, mysql or redis - or others.  

(To install may need to use sudo or as root user.)

### MongoDB

See: [http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/).

```
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" | tee -a /etc/apt/sources.list.d/10gen.list
apt-get -y update
apt-get -y install mongodb-10gen
```

Install the mongodb client module for node.js.
```
npm install mongodb -g
```
To start/stop/restart mongo.
```
sudo service mongodb start
sudo service mongodb stop
sudo service mongodb restart
```


## Notes

To get the address/ip of an instance, see this [document](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html).  

To get the public dns address (ip) of an instance, from inside that instances terminal.
```
curl http://169.254.169.254/latest/meta-data/public-ipv4
```
To get the private (local/internal ip) dns address of an instance.
```
curl http://169.254.169.254/latest/meta-data/local-ipv4
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

