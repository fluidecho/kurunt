/*
-----------------------------------------------------------------------------
 Kurunt Arduino Sensor TCP Client
 
 This arduino sketch connects a sensor to Kurunt (http://kurunt.org)
 via a Ethernet shield (Wiznet Ethernet module).

 Sending messages format: duid pin value LF
 EG: 34d1c35063280164 A03 55\n

 Version: 0.1
 Author: Mark W. B. Ashcroft (mark [at] kurunt [dot] com)
 This code is in the public domain without warranty.
-----------------------------------------------------------------------------
*/

#include <SPI.h>
#include <Ethernet.h>


//-------------------------------- Settings ---------------------------------
// Enter a MAC address for your controller below (if required).
// Newer Ethernet shields have a MAC address printed on a sticker on the shield
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress serverIP(192,168,1,6); 						// Set IP Address to Kurunt TCP input.
int serverPort = 5555;											// default Kurunt TCP Input port 5555.
int sendRate = 1000;												// how often to send messages, in milliseconds.


// Initialize the Ethernet client library with the IP address and port of the Kurunt TCP input server.
EthernetClient client;

void setup() {
	// start the serial for debugging
	Serial.begin(38400);
	// start the Ethernet connection:
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
		// no point in carrying on, so do nothing forevermore:
		for(;;)
			;
	}
	// give the Ethernet shield a second to initialize:
	delay(1000);
	Serial.println("Connecting to Kurunt ...");

	// if you get a connection to the Server
	if (client.connect(serverIP, serverPort)) {
		Serial.println("connected");					// report it to the serial.
	} else {
		Serial.println("connection failed");			// failed to connect to the server.
	}
}

void loop() {
	// if there are incoming bytes available
	// from the server, read them and print them:
	if (client.available()) {
		char c = client.read();
		Serial.print(c);
	}

	// if the server's disconnected, stop the client:
	if (!client.connected()) {
		Serial.println();							// report it to the serial.
		Serial.println("disconnected");
		client.stop();

		// do nothing forevermore:
		for(;;)
			;
	}

	// send the data to Kurunt.
	delay(sendRate);
	sendData();
}


void sendData() {
	// you'll need to add you own code for pins and values.

	String pin = "A05";
	int val = analogRead(A5);

	// note is sending data to Kurunt in JSON format.
	client.println("{\"" + pin + "\":" + val + "}");				// send the message to Kurunt.

}
