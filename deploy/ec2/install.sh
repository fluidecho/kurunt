#!/bin/bash

#
# install: Installing Kurunt and dependencies.
#
# Version: 0.1
# Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
# License: MIT or Apache 2.0.
# Copyright (c) 2014 Mark W. B. Ashcroft.
# Copyright (c) 2014 Kurunt.
#
# ************** WARNING: USE THIS SCRIPT ENTIRELY AT YOUR OWN RISK!!! **************
# This script is designed for use with a EC2 64-bit instance running Ubuntu 12.04 LTS.
# 

set -eu # -x for verbose logging to juju debug-log

echo "Installing Kurunt and dependencies ..."

sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y install python-software-properties python g++ make
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get -y update
sudo apt-get -y install nodejs

echo "Switch to root user to install node.js modules."

sudo su
npm install -g kurunt
cd ../../../../../../../../../usr/lib/node_modules/kurunt/
npm install socket.io
npm install mongodb
npm install mysql
npm install redis

echo "Finished installing Kurunt and dependencies, will now launch Kurunt."

kurunt
