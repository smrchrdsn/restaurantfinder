var https = require('https'); // Safari blocks geolocation if not using HTTPS - I'm not sure if this is working though
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');

// Create a Google Maps client object - is this necessary?
const googleMapsClient = require('@google/maps').createClient({
	key: 'AIzaSyBYZYjIASCVgSUHhEt7UoRvKUF6KCPMix0'
});

// All client-side files are stored in the public folder
app.use(express.static(__dirname + '/public'));

// Support JSON encoded bodies
app.use(bodyParser.json());

// Support encoded bodies
app.use(bodyParser.urlencoded({extended: true}));

// Serve index.html
app.get('/', function(req, res) {
	res.sendFile('public/index.html', {"root": __dirname});
});

// Client request for place details
app.post('/details', function(req, res) {

	// Extract the place id from the request
	var placeid = req.body.id;
	
	// Construct the HTTP URL
	var key = 'AIzaSyBYZYjIASCVgSUHhEt7UoRvKUF6KCPMix0';
	var url = 'https://maps.googleapis.com/maps/api/place/details/json?' + 'key=' + key + '&placeid=' + placeid + '&fields=name,opening_hours,website,formatted_address,formatted_phone_number,rating,price_level';
	
	// Request place details from Google and send them to the client
	request(url, function(error, response, body) {
		// I'm ignoring the error and status code for now
		res.send(body);
	});	
});

// Listen on port 3000
var server = app.listen(3000, function() {
	console.log('App listening on port 3000');
});