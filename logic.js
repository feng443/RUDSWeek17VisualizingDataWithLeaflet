// Define base maps
var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiZmVuZzQ0MyIsImEiOiJjamh2NDd3b2owdmNhM2tsNjA1dG0wcm8xIn0.XhlIawfI8vpUvUrSkpnIng" )
var greyscaleMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiZmVuZzQ0MyIsImEiOiJjamh2NDd3b2owdmNhM2tsNjA1dG0wcm8xIn0.XhlIawfI8vpUvUrSkpnIng" )
var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiZmVuZzQ0MyIsImEiOiJjamh2NDd3b2owdmNhM2tsNjA1dG0wcm8xIn0.XhlIawfI8vpUvUrSkpnIng" )
// Define a baseMaps object to hold our base layers
var baseMaps = {
    'Satellite': satelliteMap,
    'Greyscale': greyscaleMap,
    'Outdoors': outdoorsMap,
}

// Store our API endpoint as queryUrl
var queryUrl = "http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=" +
  "2014-01-02&maxlongitude=-69.52148437&minlongitude=-123.83789062&maxlatitude=48.74894534&minlatitude=25.16517337"
queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'

var tectonicUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json'

const COLORS = [
    'white',
    '#B5F050',
    '#DDF051',
    '#ECD650',
    '#E9B24E',
    '#E59F66',
    '#E16364',
]

var LABELS = ['<0', '0-1', '1-2', '2-3', '3-4', '4-5', '>5']

function getColor(mag) {
    var i = i > 5 ? 5 : i < 0 ? 0  : Math.ceil(mag)
    return COLORS[i]
}

function getTooltip(d) {
    let place = d.properties.place
    let mag = d.properties.mag
    return `${place}: ${mag}`
}

var earthquakeMarkers = []
d3.queue()
.defer(d3.json, queryUrl)
.defer(d3.json, tectonicUrl)
.await(function(error, data, tectonicData) {
  // Using the features array sent back in the API data, create a GeoJSON layer and add it to the map

    data.features.forEach( d => {
        let c = d.geometry.coordinates
        let coord= [c[1], c[0]]
        let mag = d.properties.mag
        let place = d.properties.place
        mag = Math.abs(mag)
        let color = getColor(mag)
        earthquakeMarkers.push(
            L.circle(coord, {
                radius: Math.sqrt(mag) * 40000,
                color: color,
                fillColor: color,
                opacity: 0.8,
            }).bindTooltip(getTooltip(d))

        )
    }
    )

    // Add Legend
    var legend = L.control({ position: 'bottomright' })
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend')
        labels = []
        // Add min & max
        //div.innerHTML = '<div class="labels"><div class="min">' + LABELS[0] + '</div>' +
		//	'<div class="max">' + LABELS[LABELS.length - 1] + '</div></div>'

        COLORS.forEach(function (color, i) {
            labels.push('<li style="background-color: ' + color + '">' + LABELS[i] + '</li>')
        })

        div.innerHTML += '<ul>' + labels.join('') + '</ul>'
        return div
    }

    earthquakeLayer = L.layerGroup(earthquakeMarkers)

    var tectonicLayer = L.geoJson(tectonicData, {
        style: {
                color: "orange",
                colorOpacity: 0.5,
                weight: 1.5
        }
    })

    var overlayMap = {
        'Fault Lines': tectonicLayer,
        'Earthquarks': earthquakeLayer,
    }

    // Create a new map
    var myMap = L.map("map", {
        center: [ 37.09, -95.71 ],
        zoom: 5,
        layers: [satelliteMap, tectonicLayer, earthquakeLayer]
    })

    // Create a layer control containing our baseMaps
    // Be sure to add an overlay Layer containing the earthquake GeoJSON
    L.control.layers(baseMaps, overlayMap, {
        collapsed: false
    }).addTo(myMap)

    legend.addTo(myMap)


})