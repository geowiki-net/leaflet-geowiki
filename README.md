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

// Initialize Geowiki viewer
var geowiki = new LeafletGeowiki({
  source: 'file.osm', // Overpass API URL, .osm or .osm.bz2 file
  style: 'file.yaml'
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
