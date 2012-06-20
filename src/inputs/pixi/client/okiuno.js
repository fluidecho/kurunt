/*
 * Okiuno v1.1
 * http://okiuno.com
 * Copyright 2011 Okiuni, All Rights Reserved.
 *
 * We provides web analytics services and apply the highest standards for protecting visitor privacy, see - http://okiuno.com/privacy-policy-tag/
 */

var timeDCL;


function addListener(obj, eventName, listener) {
	if(obj.addEventListener) {
		obj.addEventListener(eventName, listener, false);
	} else {
		obj.attachEvent("on" + eventName, listener);
	}
}

function finishedDCL() {
	doTagThing();
	timeDCL = new Date();
	document.getElementById('DCL').innerHTML = "<span class='done'>DONE!</span>";
//alert('hi');
}

function finishedLoad() {
	if(timeDCL) {

		var delta = new Date() - timeDCL;
		document.getElementById('delta').innerHTML = delta + "ms";

	}

	document.getElementById('load').innerHTML = "<span class='done'>DONE!</span>";

}

addListener(document, "DOMContentLoaded", finishedDCL);
addListener(window, "load", finishedLoad);

if(!window.addEventListener) {
	document.getElementById('DCL').innerHTML = "(not supported)";
}

 
 
//window.onload = function () {	
function doTagThing() {

	var testClass = new RegExp("(^|\\s)okiuno_tag(\\s|$)");
	var elements = document.getElementsByTagName('img');
	var current;
	var className = 'okiuno_tag';
	var okiunotags = [];
	var tag;
	var c = 0;
	var length = elements.length;
	for (var i=0; i<length; i++) {
		current = elements[i];
		if (testClass.test(current.className)) {
		//alert(current.src);
		current.src = '';
			tag = current.src.substring(current.src.indexOf('.gif') - 9, current.src.indexOf('.gif'));
			if (tag.length == 9) { 
				okiunotags[c] = tag; 
				c++;
			} 
		}	
	}
	//return okiunotags;	
	

	try {
		var okiunotags = _getOkiunoTags();
		var length = okiunotags.length;
		if (okiunotags.length < 1) {
			return;
		}
	} catch (failed) {
		return;
	}
	console.debug(okiunotags);
	//return;

	for (var i=0; i<length; i++) {
		try {
			var ran = Math.round(Math.random()*215241350);
			var referral = _dRef();
			var img = new Image(1,1);
			img.alt = "";
			img.src = "http://192.168.1.22/okiuno_tag/"+okiunotags[i]+".gif?ran="+ran+"&referral="+referral;
			img.onload = function() { _uDo(); }
		} catch (failed) {
			return;
		}
	}
	return;
}
 
function _uDo() { return; }
function _dRef() {
	var referral = '';
	try {
		referral = top.document.referrer;
		if ( referral == '' ) {
			referral = document.referrer;
		}
	} catch (failed) {
		referral = document.referrer;
	}
	return encodeURIComponent(referral);
} 
 
 
 
 
 
 
 
/*  
window.onbeforeunload = function () {	
	try {
		var okiunotags = _getOkiunookiunotags();
		var length = okiunotags.length;
		if (okiunotags.length < 1) {
			return;
		}
	} catch (failed) {
		return;
	}
	var requestHttp;	
	requestHttp = _getRequestHttpObject();
	if (requestHttp == null) {
	    return;
	}
	for (var i=0; i<length; i++) {
		try {
			requestHttp.onreadystatechange = null;
			requestHttp.open("GET", "http://127.0.0.1/okiuno_tag/adieu.gif?tag=" + okiunotags[i] + "&sid=" + Math.random(), false);
			requestHttp.send(null);
		} catch (failed) {
			return;
		}
	}
	return;
}
 */
function _getOkiunoTags() {
/* 	var testClass = new RegExp("(^|\\s)okiuno_tag(\\s|$)");
	var elements = document.getElementsByTagName('img');
	var current;
	var className = 'okiuno_tag';
	var okiunotags = [];
	var tag;
	var c = 0;
	var length = elements.length;
	for (var i=0; i<length; i++) {
		current = elements[i];
		if (testClass.test(current.className)) {
			tag = current.src.substring(current.src.indexOf('.gif') - 9, current.src.indexOf('.gif'));
			if (tag.length == 9) { 
				okiunotags[c] = tag; 
				c++;
			} 
		}	
	}
	return okiunotags; */

var okiunotags = [];
var tag;
var c = 0;	
var bodyText = document.getElementsByTagName("body")[0].innerHTML;
//var okiunoTagReg = /okiuno:/gm;
var okiunoTagArray;
var okiunoTagIndex;
//while ((okiunoTagArray = okiunoTagReg.exec(bodyText)) != null)
for ( var okiunoTagReg = /okiuno:/gm; okiunoTagArray = okiunoTagReg.exec(bodyText); okiunoTagArray != null) {
	//var msg = "Found " + okiunoTagArray[0] + ".  ";
	//msg += "Next match starts at " + okiunoTagReg.lastIndex;
	// alert(msg);
	okiunoTagIndex = okiunoTagReg.lastIndex;
	tag = bodyText.substring(okiunoTagIndex, okiunoTagIndex + 9);
	if (tag.indexOf(" ") == -1) { 
		okiunotags[c] = tag; 
		c++;
	} 	
	if ( bodyText.substring(okiunoTagIndex - 8, okiunoTagIndex - 7) == ' ' ) {
		document.getElementsByTagName("body")[0].innerHTML = document.getElementsByTagName("body")[0].innerHTML.replace(' okiuno:'+tag, "");
	} else {
		document.getElementsByTagName("body")[0].innerHTML = document.getElementsByTagName("body")[0].innerHTML.replace('okiuno:'+tag, "");
	}
}
bodyText = '';
return okiunotags;	

/* 
	
var hs = "Step 4032: add 500 to 600 pinches of pepper to your delicious soup";
var match = null;

	for (var re = /okiuno_tag/g, match = re.exec(bodyText); match != null; match = re.exec(match.input)) {

	//for (var re=/okiuno_tag/g; match = re.exec(bodyText);) {
	// use the match[0] substring which maps to match.input at position match.index
alert(match[2]);
consol.debug(match);
}
	
	
	//document.getElementsByTagName("body")[0].innerHTML = bodyText.replace(/okiuno:/g,"");
	//alert(bodyText);
	return; */
	

}
