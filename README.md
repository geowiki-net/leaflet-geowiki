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
* language: The language to use, default: null (auto-detect).
* style: style definition as JS object (if neither 'style' nor 'styleFile' are defined, uses 'nwr' as query)
* styleFile: loads the style from the specified file (.json or .yaml)
* info: pass an object with { dom: domNode }. The map info will be rendered into this domNode.

Static Methods:
* addExtension({ ... }): Add an extension to LeafletGeowiki. The following options can be passed:
  * initFun(object, callback): a function which will be called when a LeafletGeowiki object is initialized (you could hook to events in this function).
* setOption(option, value): set the specified option to the specified value. The 'updateOptions' event (with: key) will be emitted.
