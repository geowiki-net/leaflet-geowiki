/* global openstreetbrowserPrefix */
/* eslint camelcase: 0 */
var OverpassLayer = require('overpass-layer')
const isTrue = require('overpass-layer/src/isTrue')
var OverpassLayerList = require('overpass-layer').List
var queryString = require('query-string')
const ee = require('event-emitter')
const yaml = require('js-yaml')
const modulekitLang = require('modulekit-lang')
const async = {
  each: require('async/each'),
  parallel: require('async/parallel'),
}

var tabs = require('modulekit-tabs')
var queryString = require('query-string')
const extensions = []

const showMore = require('./showMore')

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

var defaultValues = {
  feature: {
    title: '{{ tags.name|default(tags.operator)|default(tags.ref) }}',
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

    this.loadStyle((err) => {
      if (err) { return console.error(err) }
      this.initExtensions()
    })
  }

  initExtensions () {
    async.parallel([
      (done) => modulekitLang.set(null, {}, done),
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
    var p

    // set undefined data properties from defaultValues
    for (var k1 in defaultValues) {
      if (!(k1 in this.data)) {
        this.data[k1] = JSON.parse(JSON.stringify(defaultValues[k1]))
      } else if (typeof defaultValues[k1] === 'object') {
        for (var k2 in defaultValues[k1]) {
          if (!(k2 in this.data[k1])) {
            this.data[k1][k2] = JSON.parse(JSON.stringify(defaultValues[k1][k2]))
          } else if (typeof defaultValues[k1][k2] === 'object') {
            for (var k3 in defaultValues[k1][k2]) {
              if (!(k3 in this.data[k1][k2])) {
                this.data[k1][k2][k3] = JSON.parse(JSON.stringify(defaultValues[k1][k2][k3]))
              }
            }
          }
        }
      }
    }

    // get minZoom
    if ('minZoom' in this.data) {
      // has minZoom
    } else if (typeof this.data.query === 'object') {
      this.data.minZoom = Object.keys(this.data.query)[0]
    } else {
      this.data.minZoom = 14
    }

    this.data.feature.appUrl = '#' + this.id + '/{{ id }}'
    this.data.styleNoBindPopup = [ 'selected' ]
    this.data.stylesNoAutoShow = [ 'selected' ]
    this.data.updateAssets = this.updateAssets.bind(this)
    this.data.overpassFrontend = this.options.overpassFrontend

    this.layer = new OverpassLayer(this.data)

    this.layer.onLoadStart = (ev) => {
      this.emit('loadingStart', ev)
    }
    this.layer.onLoadEnd = (ev) => {
      this.emit('loadingEnd', ev)

      if (ev.error) {
        console.error('Error loading data from Overpass API: ' + ev.error)
      }
    }
    this.layer.on('update', (object, ob) => {
      if (!ob.popup || !ob.popup._contentNode || map._popup !== ob.popup) {
        return
      }

      this.emit('update', object, ob)
    })
    this.layer.on('layeradd', () => this.emit('layeradd'))
    this.layer.on('layerremove', () => this.emit('layerremove'))
    this.layer.on('add', (ob, data) => this.emit('add', ob, data))
    this.layer.on('remove', (ob, data) => this.emit('remove', ob, data))
    this.layer.on('zoomChange', (ob, data) => this.emit('zoomChange', ob, data))
    this.layer.on('twigData', (ob, data, result) => this.emit('twigData', ob, data, result))

    // layer has already been added, add now after initializing
    if (this.map) {
      this.layer.addTo(this.map)
    }
  }

  // compatibilty Leaflet Layerswitcher
  _layerAdd (e) {
    console.log(e.target)
    this.addTo(e.target)
  }

  // compatibilty Leaflet Layerswitcher
  onRemove () {
    this.layer.remove()
  }

  // compatibilty Leaflet Layerswitcher - use emit instead
  fire () {
  }

  updateAssets (div) {
    var imgs = Array.from(div.getElementsByTagName('img'))
    imgs.forEach(img => {
      // TODO: 'src' is deprecated, use only data-src
      var src = img.getAttribute('src') || img.getAttribute('data-src')
      if (src !== null) {
        this.emit('updateImageSrc', img, src)
      }
    })
  }

  recalc () {
    this.layer.recalc()
  }

  get (id, callback) {
    this.layer.get(id, callback)
  }

  show (id, options, callback) {
    if (this.currentDetails) {
      this.currentDetails.hide()
    }

    let layerOptions = {
      styles: [ 'selected' ],
      flags: [ 'selected' ]
    }

    let idParts = id.split(/:/)
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

    this.currentDetails = this.layer.show(id, layerOptions,
      (err, ob, data) => {
        if (!err) {
          if (!options.hasLocation) {
            var preferredZoom = data.data.preferredZoom || 16
            var maxZoom = this.map.getZoom()
            maxZoom = maxZoom > preferredZoom ? maxZoom : preferredZoom
            this.map.flyToBounds(data.object.bounds.toLeaflet({ shiftWorld: this.layer.getShiftWorld() }), {
              maxZoom: maxZoom
            })
          }
        }

        callback(err, data)
      }
    )
  }

  allMapFeatures (callback) {
    if (!this.isOpen) {
      return callback(null, [])
    }

    let list = Object.values(this.layer.mainlayer.visibleFeatures)

    list = list.filter(item => !isTrue(item.data.exclude))

    callback(null, list)
  }

  addTo (map) {
    this.map = map
    if (this.layer) {
      this.layer.addTo(map)
    }

    return this
  }

  /**
   * render a twig template. The following variables will be available: 'const' (the 'const' section from the stylesheet), 'layer_id' (the 'id' of the stylesheet, if it has any), 'map.zoom' (current zoom level), 'map.metersPerPixel' (size of a pixel at the map center).
   * @param {string} template A twig template
   * @returns {string} The result
   */
  renderTemplate (template) {
    const t = OverpassLayer.twig.twig({ data: template, autoescape: true })

    const data = {
      layer_id: this.id,
      'const': this.data.const
    }
    if (this.map) {
      data.map = {
        zoom: this.map.getZoom(),
        metersPerPixel: 40075016.686 * Math.abs(Math.cos(this.map.getCenter().lat / 180 * Math.PI)) / Math.pow(2, this.map.getZoom() + 8)
      }
    }
    this.emit('renderTemplate', data)

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
