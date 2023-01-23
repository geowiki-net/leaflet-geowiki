import OverpassFrontend from 'overpass-frontend'

export class LeafletGeowiki {
  constructor (options) {
    this.options = options

    if (!options.source) {
      options.source = '//overpass-api.de/api/interpreter'
    }

    if (options.source instanceof OverpassFrontend) {
      this.source = options.source
    } else {
      this.source = new OverpassFrontend(options.source)
    }
  }

  // compatibilty Leaflet Layerswitcher
  _layerAdd (e) {
    this.addTo(e.target)
  }

  // compatibilty Leaflet Layerswitcher
  onRemove () {
    this.remove()
  }

  // compatibilty Leaflet Layerswitcher - use emit instead
  fire () {
  }

  addTo (map) {
    this.map = map
  }
}
