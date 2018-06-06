/*

<Chan Feng> 2018-06-04 Rutgers Data Science Data Visualization Bootcamp

*/

// Store our API endpoint as earthquakeUrl
const earthquakeUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
const tectonicUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json'
const vocalnoURL = 'https://data.humdata.org/dataset/a60ac839-920d-435a-bf7d-25855602699d/resource/7234d067-2d74-449a-9c61-22ae6d98d928/download/volcano.json'

const COLORS = [ '#B5F050', '#DDF051', '#ECD650', '#E9B24E', '#E59F66', '#E16364', ]
const LABELS = ['0-1', '1-2', '2-3', '3-4', '4-5', '5+']

// Define base map layer
const TOKEN = "access_token=pk.eyJ1IjoiZmVuZzQ0MyIsImEiOiJjamh2NDd3b2owdmNhM2tsNjA1dG0wcm8xIn0.XhlIawfI8vpUvUrSkpnIng"
var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" + TOKEN)
var greyscaleMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?" + TOKEN)
var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" + TOKEN)
 baseMaps = {
    'Satellite': satelliteMap,
    'Greyscale': greyscaleMap,
    'Outdoors': outdoorsMap,
}

// Dynamically create circle options
function getCircleOptions(feature) {
    mag = Math.abs(feature.properties.mag) // Occasionally mag is negative
    i = Math.floor(mag)
    var i = i > 5 ? 5 : Math.floor(mag)
    return {
        radius: Math.sqrt(mag) * 10,
        color: 'grey',
        fillColor: COLORS[i],
        opacity: 1,
        fillOpacity: 0.8,
        weight: 2,
    }
}

// Marker popup
function getPopup(feature) {
    let title = feature.properties.title
    let detail = feature.properties.detail
    return `<h2><a href=${detail} target=_new>${title}</a></h2>`
}

// Use d3.queue() to handle multiple data sources
d3.queue()
.defer(d3.json, earthquakeUrl)
.defer(d3.json, tectonicUrl)
.await(function(error, earthquakeData, tectonicData) {

    // Earthquark Markers Layer
    earthquakeLayer = L.geoJson(earthquakeData, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, getCircleOptions(feature),
                {renderer: L.SVG, className: 'shadow'}
            ).bindPopup(getPopup(feature))
        }
    });

    // Parse time automatically for time dimension control
    earthquakeLayer = L.timeDimension.layer.geoJson(earthquakeLayer, {duration: 'PT4H'})

    // Add Legend
    var legend = L.control({ position: 'bottomright' })
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend')
        labels = []
        COLORS.forEach(function (color, i) {
            labels.push('<li><span style="background-color: ' + color + '">&nbsp;&nbsp;&nbsp;&nbsp;</span> ' + LABELS[i] + '</li>')
        })
        div.innerHTML += '<ul>' + labels.join('') + '</ul>'
        return div
    }

    // Fault Lines Layer
    var tectonicLayer = L.geoJson(tectonicData, {
        style: {
                color: "orange",
                colorOpacity: 0,
                fillColor: 'white',
                fillOpacity: 0,
                weight: 1
        }
    })

    var overlayMap = {
        //'Fault Lines': tectonicLayer,
        'Earthquarks': earthquakeLayer,

        'Fault Lines': tectonicLayer,
    }

    // Create a new map
    var myMap = L.map("map", {
        center: [ 37.09, -10 ], // Adjust center to show most of world map in a typical screen
        zoom: 3,
        layers: [satelliteMap, tectonicLayer, earthquakeLayer],
        timeDimension: true,
        timeDimensionControl: true,
        timeDimensionOptions: {
            period: 'PT1H'
        },
        timeDimensionControlOptions: {
            autoPlay: true,
            playerOptions: {
                buffer: 10,
                transitionTime: 400,
                loop: true,
        }
    },

    })

    // Create a layer control containing our baseMaps
    // Be sure to add an overlay Layer containing the earthquake GeoJSON
    L.control.layers(baseMaps, overlayMap, {
        collapsed: false
    }).addTo(myMap)

    legend.addTo(myMap)
})