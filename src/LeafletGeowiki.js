export class LeafletGeowiki {
  constructor (options) {
    this.options = options
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
