Kurunt
======

An analytics platform for real-time data.

**Kurunt is currently in 'very alpha' initial release, so it will require manual tinkering and installation to get working. If you'd just like to play with it running, try our public AMI. I will be making it more usable in the coming weeks/months - stay tuned.**


## License ##

Kurunt is a open source project under [Apache License](http://www.apache.org/licenses/LICENSE-2.0).

Some dependencies Kurunt uses apply different open source [licenses](#licenses).


## Installation on EC2 using AMI - Quick Start ##

The quickest and easiest way to get started is to use our public AMI (Amazon Web Services).


## To Do List ##

- lots!


## Installation from Source - Step by Step ##

These instruction are for installing on Ubuntu 12.04 server, however similarly apply to most *nix systems. Installation under root user use _sudo_ otherwise. Replace _nano_ with _vi_ or your favourite editor. I use the /opt directory for dependencies.

	
### To Install ###

Goal to get all this running on a micro instance with a bit of memory left to be able to do some actual data analysis. Dependencies required:

- **Node.js** (what kurunt is writen in)
- **Sphinx** (search/query indexs)
- **MySQL** (used to store administrative information like users, schemes, settings)
- **ZeroMQ** (used as a message queues)
- **GeoIP** (Geo locate IP addresses)


#### Ubuntu AMIs ####

[12.04 LTS	Precise Pangolin (server edition)](http://uec-images.ubuntu.com/server/precise/current/)

	sudo su

#### Ubuntu Dependencies ####

	apt-get -y update && apt-get upgrade
    apt-get -y install git git-core
    apt-get -y install curl build-essential automake libtool pkg-config
	apt-get -y install openssl libssl-dev		# node.js
	apt-get -y install uuid-dev					# zeromq

	
#### MySQL ####

	apt-get install mysql-server
	apt-get install libmysqlclient-dev			# for db-mysql
	
Set user to root and pass to: 3Dfa87b	


#### Node.js ####

##### Install node from source (apt-get install nodejs worked but acted funny! so install from source)

    cd opt
	wget http://nodejs.org/dist/v0.6.19/node-v0.6.19.tar.gz
	tar xzvf node-v0.6.19.tar.gz
	cd node-v0.6.19
    ./configure
    make		# takes ages
    make install
    node -v		# check is working

##### Install npm for node modules

	cd /opt
    curl http://npmjs.org/install.sh | sh	
	
##### Now some node modules #####

Note the -g means install globally within /usr/local/lib/node_modules.

Native MySQL.

	npm install mysql@2.0.0-alpha2 -g
	
db-mysql

	npm install db-mysql -g
	
Installs to: /usr/local/lib/node_modules/mysql.	

Express, for public webpages 'www'.

	npm install express -g

Installs to: /usr/local/lib/node_modules/express. Now install [express](http://expressjs.com) dependencies.

	npm install jade -g

Markdown (optional) can use markdown code in jade templates.	
	
	npm install -g markdown
	
To activate express cd to /kurunt/www/ and execute 'epress' command, -s is for cookie session support.

	express -s
	
This will install the necessary files and folders within www. Can use my www.js instead of express's app.js script.
	
Install socket.io.

	npm install socket.io -g

Installs to: /usr/local/lib/node_modules/socket.io



#### Sphinx ####

Note, --enable-id64 build sphinx with 64bit document id support.

	cd /opt
	wget http://sphinxsearch.com/files/sphinx-2.0.4-release.tar.gz
	tar xzvf sphinx-2.0.4-release.tar.gz
	cd sphinx-2.0.4-release
	./configure --without-mysql --enable-id64
	make			# take a while
	make install
	searchd -h		# check is working

		
	
##### Install the node.js native module	#####

	
	
#### ZeroMQ ####

Note version 3 is out yet to test.	
	
	cd /opt
	git clone https://github.com/zeromq/zeromq2-x.git
	cd zeromq2-x
	./autogen.sh
	./configure
	make
	make check		# optional
	make install
	
Node dependency.

	npm install zmq -g
	cd /usr/local/lib/node_modules/zmq
	npm install
	make
	make test
	
	
#### GeoIP ####


##### Install GeoIP databases (from Maxmind)

Your work needs to conform with Maxmind license; "This product includes GeoLite data created by MaxMind, available from http://maxmind.com/"

	cd tmp
	wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz
	gunzip GeoIP.dat.gz
	mkdir /usr/local/share/GeoIP/
	mv GeoIP.dat /usr/local/share/GeoIP/
	wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
	gunzip GeoLiteCity.dat.gz
	mv GeoLiteCity.dat /usr/local/share/GeoIP/
	wget http://geolite.maxmind.com/download/geoip/database/GeoIPv6.dat.gz
	gunzip GeoIPv6.dat.gz
	mv GeoIPv6.dat /usr/local/share/GeoIP/
	wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCityv6-beta/GeoLiteCityv6.dat.gz
	gunzip GeoLiteCityv6.dat.gz
	mv GeoLiteCityv6.dat /usr/local/share/GeoIP/

##### Install GeoIP C library

	apt-get install libgeoip-dev

##### Geoip for node.js

	npm install geoip -g

installs to: /usr/local/lib/node_modules/geoip


#### A bit more ####
	
Create the sphinx directories.
	
	mkdir /var/sphinx
	mkdir /var/sphinx/log
	mkdir /var/sphinx/data

Open port 3000 on your server or security group if using AWS.

To run Kurunt:

	node /opt/kurunt/index.js


If things go badly can manually remove sphinx index to start over:

		searchd --stop
		cd /var/sphinx/data/
		rm -r *			# carefull!!!
		cd /var/sphinx/log/
		rm -r *			# carefull!!!
		
And can manually remove mysql index references in kurunt.data, indexes, users. Could delete entire database if wanted to start fresh.		

		
<a name="licenses"></a>
## Licenses ##

Kurunt is released under Apache License v2, which is located at http://www.apache.org/licenses/LICENSE-2.0

Ubuntu and dependent libraries are released mainly under the GNU General Public License, which is located at http://www.ubuntu.com/project/about-ubuntu/licensing

MySQL and MySQL Proxy is released under the GNU General Public License v2, which is located at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html

Node.js is released under the MIT License, which is located http://www.opensource.org/licenses/mit-license.php

NPM (Node Package Manager) is released under GNU GPL version 3 or later, which is located at http://gnu.org/licenses/gpl.html

PHP and related libraries are released under the PHP License v3.01, which is located at http://www.php.net/license/3_01.txt

MondoDB is released under GNU Affero General Public License v3.0 (drivers: Apache license), which is located at http://www.gnu.org/licenses/agpl.html

ZeroMQ (ØMQ) is released under the GNU Lesser General Public License, which is located at http://www.gnu.org/licenses/lgpl.html

GeoIP C library is released under GNU Lesser General Public License, which is located at http://www.gnu.org/licenses/lgpl.html

GeoIP databases are released under OPEN DATA LICENSE, which is located at http://geolite.maxmind.com/download/geoip/database/LICENSE.txt

Git is released under the GNU General Public License v2, which is located at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html

Sphinx (search) is released under the GNU General Public License v2, which is located at http://www.gnu.org/licenses/old-licenses/gpl-2.0.html

Curl is released under MIT/X Derivate License, which is located at http://curl.haxx.se/docs/copyright.html

OpenSSL is released under the terms of the Apache License, which is located at http://www.openssl.org/source/license.html

Nimble (node.js module) is released under the MIT License, which is located http://www.opensource.org/licenses/mit-license.php