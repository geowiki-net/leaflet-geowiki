/* global openstreetbrowserPrefix */
/* eslint camelcase: 0 */
const OverpassLayer = require('overpass-layer')
const isTrue = require('overpass-layer/src/isTrue')
const OverpassLayerList = require('overpass-layer').List
const queryString = require('query-string')
const ee = require('event-emitter')
const yaml = require('js-yaml')
const modulekitLang = require('modulekit-lang')
const async = {
  each: require('async/each'),
  parallel: require('async/parallel')
}

const extensions = []

const listTemplate = '<a href="{{ object.appUrl|default("#") }}">' +
  '<div class="marker">' +
  '{% if object.templateMarkerSymbol|default(object.markerSymbol)|trim == "line" %}' +
  '<div class="symbol">{{ markerLine(object, {ignoreStyles:["hover"]}) }}</div>' +
  '{% elseif object.templateMarkerSymbol|default(object.markerSymbol)|trim == "polygon" %}' +
  '<div class="symbol">{{ markerPolygon(object, {ignoreStyles:["hover"]}) }}</div>' +
  '{% elseif object.templateMarkerSymbol or object.markerSymbol %}' +
  '<div class="symbol">{{ object.templateMarkerSymbol|default(object.markerSymbol) }}</div>' +
  '{% elseif object.marker and object.marker.iconUrl %}' +
  '<img class="symbol" src="{{ object.marker.iconUrl|e }}">' +
  '{% endif %}' +
  '{% if object.templateMarkerSign or object.markerSign %}' +
  '<div class="sign">{{ object.templateMarkerSign|default(object.markerSign) }}</div>' +
  '{% endif %}' +
  '</div>' +
  '<div class="content">' +
  '{% if object.templateDetails or object.details %}<div class="details">{{ object.templateDetails|default(object.details) }}</div>{% endif %}' +
  '{% if object.templateDescription or object.description %}<div class="description">{{ object.templateDescription|default(object.description) }}</div>{% endif %}' +
  '{% if object.templateTitle or object.title %}<div class="title">{{ object.templateTitle|default(object.title) }}</div>{% endif %}' +
  '</div>' +
  '</a>'

const defaultValues = {
  feature: {
    title: '{{ tags.name|default(tags.operator)|default(tags.ref) }}',
    description: "{% set _k = true %}{% for k in ['amenity', 'shop', 'craft', 'office', 'place', 'tourism', 'historic', 'highway', 'power', 'railway', 'route', 'leisure', 'barrier', 'military', 'man_made', 'building', 'natural', 'landuse', 'waterway'] %}{% if _k and tags[k] %}{{ tagTransList(k, tags[k]) }}{% set _k = false %}{% endif %}{% endfor %}",
    markerSign: '',
    'style:selected': {
      color: '#3f3f3f',
      width: 3,
      opacity: 1,
      radius: 12,
      pane: 'selected'
    },
    markerSymbol: null,
    preferredZoom: 16
  },
  layouts: {
    list: listTemplate.replace(/template/g, 'list'),
    popup:
      '<div class="header">' +
      '  {% if object.popupDescription or object.description %}<div class="description">{{ object.popupDescription|default(object.description) }}</div>{% endif %}' +
      '  {% if object.popupTitle or object.title %}<div class="title">{{ object.popupTitle|default(object.title) }}</div>{% endif %}' +
      '</div>' +
      '{% if object.popupBody or object.body %}<div class="block"><div class="body">{{ object.popupBody|default(object.body) }}</div></div>{% endif %}'
  },
  queryOptions: {
  }
}

class LeafletGeowiki {
  constructor (options) {
    if (!options.overpassFrontend) {
      if (!global.overpassFrontend) {
        global.overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter')
      }

      options.overpassFrontend = global.overpassFrontend
    }

    this.options = options
    this.isLoading = 0

    this.loadStyle((err) => {
      if (err) { return console.error(err) }
      this.initExtensions()
    })
  }

  initExtensions () {
    async.parallel([
      (done) => modulekitLang.set(this.options.language, {}, done),
      (done) => async.each(extensions, (extension, done) => {
        if (extension.initFun) {
          extension.initFun(this, done)
        } else {
          done()
        }
      }, done)
    ], (err) => {
      if (err) { return console.error(err) }
      this.init()
    })
  }

  loadStyle (callback) {
    this.data = { query: 'nwr' }
    if (this.options.style) {
      this.data = this.options.style
    } else if (this.options.styleFile) {
      fetch(this.options.styleFile)
        .then(req => req.text())
        .then(body => {
          this.data = yaml.load(body)
          callback()
        })
      return
    }

    callback()
  }

  init () {
    let p

    let layerDefs = [this.data]
    if (this.data.layers) {
      if (Array.isArray(this.data.layers)) {
        layerDefs = this.data.layers
      } else {
        layerDefs = Object.entries(this.data.layers).map(([k, l]) => {
          l.id = k
          return l
        })
      }
    }

    this.layers = []
    layerDefs.forEach(def => this.initLayer(def))
  }

  initLayer (data) {
    // set undefined data properties from defaultValues
    for (const k1 in defaultValues) {
      if (!(k1 in data)) {
        data[k1] = JSON.parse(JSON.stringify(defaultValues[k1]))
      } else if (typeof defaultValues[k1] === 'object') {
        for (const k2 in defaultValues[k1]) {
          if (!(k2 in data[k1])) {
            data[k1][k2] = JSON.parse(JSON.stringify(defaultValues[k1][k2]))
          } else if (typeof defaultValues[k1][k2] === 'object') {
            for (const k3 in defaultValues[k1][k2]) {
              if (!(k3 in data[k1][k2])) {
                data[k1][k2][k3] = JSON.parse(JSON.stringify(defaultValues[k1][k2][k3]))
              }
            }
          }
        }
      }
    }

    // get minZoom
    if ('minZoom' in data) {
      // has minZoom
    } else if (typeof data.query === 'object') {
      data.minZoom = Object.keys(data.query)[0]
    } else {
      data.minZoom = 14
    }

    data.feature.appUrl = '#' + this.id + '/{{ id }}'
    data.styleNoBindPopup = ['selected']
    data.stylesNoAutoShow = ['selected']
    data.updateAssets = this.updateAssets.bind(this)
    data.overpassFrontend = this.options.overpassFrontend

    const layer = new OverpassLayer(data)

    layer.onLoadStart = (ev) => {
      if (this.isLoading++ === 0) {
        this.emit('loadingStart', ev)
      }
    }
    layer.onLoadEnd = (ev) => {
      if (--this.isLoading === 0) {
        this.emit('loadingEnd', ev)
      }

      if (ev.error) {
        console.error('Error loading data from Overpass API: ' + ev.error)
      }
    }
    layer.on('update', (object, ob) => {
      if (!ob.popup || !ob.popup._contentNode || map._popup !== ob.popup) {
        return
      }

      this.emit('update', object, ob)
    })
    layer.on('layeradd', () => this.emit('layeradd'))
    layer.on('layerremove', () => this.emit('layerremove'))
    layer.on('add', (ob, data) => this.emit('add', ob, data))
    layer.on('remove', (ob, data) => this.emit('remove', ob, data))
    layer.on('zoomChange', (ob, data) => this.emit('zoomChange', ob, data))
    layer.on('twigData', (ob, data, result) => this.emit('twigData', ob, data, result))

    // layer has already been added, add now after initializing
    if (this.map) {
      layer.addTo(this.map)
    }

    this.layers.push(layer)
  }

  // compatibilty Leaflet Layerswitcher
  _layerAdd (e) {
    this.addTo(e.target)
  }

  // compatibilty Leaflet Layerswitcher
  onRemove () {
    this.layers.forEach(l => l.remove())
  }

  // compatibilty Leaflet Layerswitcher - use emit instead
  fire () {
  }

  updateAssets (div) {
    const imgs = Array.from(div.getElementsByTagName('img'))
    imgs.forEach(img => {
      // TODO: 'src' is deprecated, use only data-src
      const src = img.getAttribute('src') || img.getAttribute('data-src')
      if (src !== null) {
        this.emit('updateImageSrc', img, src)
      }
    })
  }

  recalc () {
    this.layers.forEach(l => l.recalc())
  }

  get (id, callback) {
    console.error('not implemented yet')
    // this.layer.get(id, callback)
  }

  show (id, options, callback) {
    if (this.currentDetails) {
      this.currentDetails.hide()
    }

    const layerOptions = {
      styles: ['selected'],
      flags: ['selected']
    }

    const idParts = id.split(/:/)
    switch (idParts.length) {
      case 2:
        id = idParts[1]
        layerOptions.sublayer_id = idParts[0]
        break
      case 1:
        break
      default:
        return callback(new Error('too many id parts! ' + id))
    }

    this.currentDetails = this.layers.forEach(l => l.show(id, layerOptions,
      (err, ob, data) => {
        if (!err) {
          if (!options.hasLocation) {
            const preferredZoom = data.data.preferredZoom || 16
            let maxZoom = this.map.getZoom()
            maxZoom = maxZoom > preferredZoom ? maxZoom : preferredZoom
            this.map.flyToBounds(data.object.bounds.toLeaflet({ shiftWorld: this.layer.getShiftWorld() }), {
              maxZoom
            })
          }
        }

        callback(err, data)
      }
    ))
  }

  allMapFeatures (callback) {
    let list = this.layers
      .forEach(l => Object.values(l.mainlayer.visibleFeatures))
      .flat()

    list = list.filter(item => !isTrue(item.data.exclude))

    callback(null, list)
  }

  addTo (map) {
    this.map = map
    if (this.layers) {
      this.layers.forEach(l => l.addTo(map))
    }

    return this
  }

  /**
   * render a twig template. The following variables will be available: 'const' (the 'const' section from the stylesheet), 'layer_id' (the 'id' of the stylesheet, if it has any), 'map.zoom' (current zoom level), 'map.metersPerPixel' (size of a pixel at the map center).
   * @param {string} template A twig template
   * @returns {string} The result
   */
  renderTemplate (template) {
    const t = OverpassLayer.twig.twig({ data: template, autoescape: true, rethrow: true })

    const data = {
      layer_id: this.id,
      const: this.data.const
    }
    if (this.map) {
      data.map = {
        zoom: this.map.getZoom(),
        metersPerPixel: 40075016.686 * Math.abs(Math.cos(this.map.getCenter().lat / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8)
      }
    }
    this.emit('twigData', data)

    const p = t.render(data)

    return p
  }

  /**
   * Change an option. Emits 'updateOptions'.
   * @param {string} key The key to change
   * @param {mixed} value The value of the option to change to
   */
  setOption (key, value) {
    this.options[key] = value
    this.emit('updateOptions', key)
  }
}

LeafletGeowiki.defaultValues = defaultValues

LeafletGeowiki.addExtension = (extension) => {
  extensions.push(extension)
}

ee(LeafletGeowiki.prototype)

module.exports = LeafletGeowiki
