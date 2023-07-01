# leaflet-geowiki
Combines an OSM Source and Stylesheet as layer for a Leaflet map

## Installation & simple usage
```sh
npm install leaflet-geowiki
```

Embed in JS code:
```js
// Create Leaflet map object
var map = L.map('map')

// Optionally: connect to a database. This can be a Overpass API URL, a .osm or .osm.bz2 file
var database = new OverpassFrontend('file.osm')

// Initialize Geowiki viewer
var geowiki = new LeafletGeowiki({
  overpassFrontend: database,
  styleFile: 'file.yaml'
}).addTo(map)
```

## Example style file
Geowiki uses YAML files with the same syntax as [OpenStreetBrowser](https://github.com/plepe/OpenStreetBrowser), so you can check out the [tutorial](https://github.com/plepe/openstreetbrowser-categories-examples).

```yaml
# From zoom level 15 on, load all nodes, ways and relations with amenity=restaurant.
query:
  15: nwr[amenity=restaurant]
feature:
  description: |
    {{ tagTrans('amenity', tags.amenity) }}
```

## API
### constructor LeafletGeowiki(options)
The following options are available:
* overpassFrontend: a OverpassFrontend object. If not set, the global 'overpassFrontend' variable will be used. If this is also not defined, a connection to the default Overpass API server will be created, which will be re-used by other layers.
