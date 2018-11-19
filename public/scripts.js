var map;
var markers = []; // Markers for search results
var infowindow; // This will display place information

// This is called when the Google Maps API finishes loading
function googleMapsDidLoad() {
	// Load the MarkerWithLabels library -- this requires the Google Maps to have loaded already
	var tag = document.createElement("script");
	tag.src = 'markerwithlabel.js'; // Locally hosted library from CDN -- Heroku blocks the CDN
	document.getElementsByTagName('body')[0].appendChild(tag);
	
	// Create the map
	initMap();
}

function initMap() {
	// Create a new map centered on iBec by default
	var initialLocation = {lat: 43.6552, lng: -70.2645};
	map = new google.maps.Map(document.getElementById('map'), {
		center: initialLocation,
		zoom: 13,
		disableDefaultUI: true
	});
	
	// Style the map to remove all point of interest labels
	var mapStyles = [{
		featureType: 'poi',
		elementType: 'labels',
		stylers: [
			{'visibility': 'off'}
		]
	}];
	map.set('styles', mapStyles);
	
	currentLocation();
	
	// Create the infoWindow
	infowindow = new google.maps.InfoWindow({
    	content: 'Hello World'
  	});
}

// Center the map on the user's location
function currentLocation() {
	// Center the map on the user's location
	// Try HTML5 geolocation
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			map.setCenter(pos);
		}, function() {
			return;
		});
	} else {
		// If the browser doesn't support geolocation...
		alert('Your location could not be found')
		return;
	}
}

// Get an array of restaurants given the current map bounds and search term
function searchNearby() {
	var service = new google.maps.places.PlacesService(map);
	
	// Create the request object, asking only for restaurants and using the search form input
	var requestObj = {
		bounds: map.getBounds(),
		type: 'restaurant',
		keyword: document.getElementById('input-field').value
	};
	
	// Run the search and place the markers or alert the user that nothing was found
	service.nearbySearch(requestObj, function(results, status) {
		if (results.length == 0) {
			alert('Nothing nearby was found.')
		} else {
			placeMarkers(results);
		}
	});	
}

// Populate the map with markers from service results
function placeMarkers(places) {
	// Clear any old markers
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];

	// Drop markers sequentially
	var i = 0;
	places.forEach(function(place) {
		window.setTimeout(function(){addMarker(place)}, i * 100);
		i++;
	});
}

// Add a marker for a single place
function addMarker(place) {
	if (!place.geometry) {
		console.log('Returned place has no geometry');
		return;
	}
	
	// Custom icon from an SVG file
	var iconURL = 'images/place-icon.svg';
	var icon = {
		url: iconURL,
		size: new google.maps.Size(25, 25),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(12.5, 12.5),
		scaledSize: new google.maps.Size(25, 25)
	};
	
	// Create a marker with drop animation
	marker = new MarkerWithLabel({
		map: map,
		icon: icon,
		title: place.name,
		id: place.place_id, // Store the place ID to call when marker is clicked
		position: place.geometry.location,
		animation: google.maps.Animation.DROP,
		labelContent: '<span>' + place.name + '</span>', // Use the label div as a wrapper for its text
		labelAnchor: new google.maps.Point(0, -12.5), // Position the label below the marker
		labelClass: 'label', // Style in CSS file
	});
	
	// Listen for click events on the marker
	google.maps.event.addListener(marker, 'click', function() {
	
		// Close the infowindow
		infowindow.close();
	
		// Position the infowindow over the elected marker
		infowindow.setPosition(this.getPosition());
	
		// Start to post to the server
		var xhttp = new XMLHttpRequest();
		var params = JSON.stringify({'id': this.id});
		xhttp.open('POST', 'details', true);
		
		// Set request header
		xhttp.setRequestHeader('Content-type', 'application/json');
		
		// Do something with the response when the state changes
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				showDetails(xhttp.responseText);
			}
		}
		
		// Send the request
		xhttp.send(params);
		
	});
	
	// Add the marker to the array
	markers.push(marker);
}

// Populate the infowindow
function showDetails(data) {
	// Parse just the result from the data body
	details = JSON.parse(data).result;
	
	// Make price and rating visuals, iterating to add $'s and ★'s or ☆'s
	var price = '';
	var stars = '';
	var i;
	for (i = 0; i < details.price_level; i++) {
		price += '$';
	}
	i = 0;
	// Floor the rating so stars get rounded down
	for (i = 0; i < Math.floor(details.rating); i++) {
		stars += '★';
	}
	var rating = stars.padEnd(5, '☆');
	
	// Find if there is a website and wrap it in DOM elements
	var website = ''
	if (details.website !== undefined) {
		website = '<h2 id="details-website"><a href="' +
			details.website +
			'" rel="noopener noreferrer" target="_blank">' +
			details.website +
			'</a></h2>';
	}
	
	// Set text to show 'Open Now' or 'Closed'
	var open = '';
	if (details.opening_hours.open_now) {
		open = 'Open Now';
	} else {
		open = 'Closed';
	}
	
	// Place details into DOM elements
	var dom = '<div id="details">' +
		'<h1 id="details-name">' +
		details.name +
		'</h1>' +
		'<p id="details-rating">' +
		rating +
		' ' +
		details.rating +
		'</p>' +
		'<p id="details-price">' +
		price +
		' ' +
		open +
		'</p>' +
		website +
		'<h3 id="details-phone">' +
		details.formatted_phone_number +
		'</h3>' +
		'<h3 id="details-address">' +
		details.formatted_address +
		'</h3>' +
		'</div>';
		
	// Set up and display the infowindow
	infowindow.setContent(dom);
	infowindow.open(map);
}

// On DOM load...
window.addEventListener('load', function() {
	// Catch and prevent form submit from reloading the page
	document.getElementById('search-form').addEventListener('submit', function(e) {
		e.preventDefault();
    	searchNearby();
  	});
  	// Enable clicking the search icon to submit a search
	document.getElementById('input-image').addEventListener('click', function(e) {
		searchNearby();
	});
	// Enable clicking the location icon to center the map on the user's location
	document.getElementById('current-location').addEventListener('click', function(e) {
		currentLocation();
	});
});
