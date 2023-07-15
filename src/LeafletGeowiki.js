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
      this.dom.classList.add('loading')
      if (this.parentCategory) {
        this.parentCategory.notifyChildLoadStart(this)
      }
    }
    this.layer.onLoadEnd = (ev) => {
      this.dom.classList.remove('loading')
      if (this.parentCategory) {
        this.parentCategory.notifyChildLoadEnd(this)
      }

      if (ev.error) {
        alert('Error loading data from Overpass API: ' + ev.error)
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
    this.layer.on('twigData',
      (ob, data, result) => {
        result.user = global.options
        global.currentCategory = this
      }
    )


    this.dom = document.createElement('div')
    this.dom.className = 'category category-' + this.data.type

    var p = document.createElement('div')
    p.className = 'loadingIndicator'
    p.innerHTML = '<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="sr-only">' + modulekitLang.lang('loading') + '</span>'
    this.dom.appendChild(p)

    this.domStatus = document.createElement('div')
    this.domStatus.className = 'status'

    if (this.data.lists) {
      this.dom.insertBefore(this.domStatus, this.domHeader.nextSibling)
    } else {
      p = document.createElement('div')
      p.className = 'loadingIndicator2'
      p.innerHTML = '<div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>'
      this.dom.appendChild(p)

      this.dom.appendChild(this.domStatus)
    }

    // layer has already been added, add now after initializing
    if (this.map) {
      this.layer.addTo(this.map)
    }
  }

  setParam (param) {
    this.emit('setParam', param)
    this._applyParam(param)
  }

  _applyParam (param) {
    this.emit('applyParam', param)
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

  setMap (map) {
    this.map = map

    this.map.on('zoomend', () => {
      this.updateStatus()
      this.updateInfo()
    })

    this.updateStatus()
    this.updateInfo()
  }

  updateStatus () {
    this.domStatus.innerHTML = ''

    if (typeof this.data.query === 'object') {
      var highestZoom = Object.keys(this.data.query).reverse()[0]
      if (this.map.getZoom() < highestZoom) {
        this.domStatus.innerHTML = modulekitLang.lang('zoom_in_more')
      }
    }

    if ('minZoom' in this.data && this.map.getZoom() < this.data.minZoom) {
      this.domStatus.innerHTML = modulekitLang.lang('zoom_in_appear')
    }
  }

  updateInfo () {
    if (!this.tabInfo) {
      return
    }

    global.currentCategory = this
    var data = {
      layer_id: this.id,
      'const': this.data.const
    }
    this.emit('updateInfo', data)
    if (this.map) {
      data.map = {
        zoom: this.map.getZoom(),
        metersPerPixel: this.map.getMetersPerPixel()
      }
    }
    this.domInfo.innerHTML = this.templateInfo.render(data)
    this.updateAssets(this.domInfo)
    global.currentCategory = null
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

  notifyPopupOpen (object, popup) {
    if (this.currentSelected) {
      this.currentSelected.hide()
    }

    let layerOptions = {
      styles: [ 'selected' ],
      flags: [ 'selected' ],
      sublayer_id: object.sublayer_id
    }

    if (popup._contentNode) {
      popup._contentNode.style = ''
    }

    this.currentSelected = this.layer.show(object.id, layerOptions, () => {})

    // Move close button into the content, to make its position depending whether a scrollbar is visible or not
    popup._closeButton.setAttribute('data-order', -1001)
    popup._contentNode.insertBefore(popup._closeButton, popup._contentNode.firstChild)
  }

  notifyPopupClose (object, popup) {
    if (this.currentSelected) {
      this.currentSelected.hide()
      this.currentSelected = null
    }

    if (this.currentDetails) {
      this.currentDetails.hide()
      this.currentDetails = null
    }

    if (this.currentPopupDisplay) {
      this.currentPopupDisplay.close()
      delete this.currentPopupDisplay
    }
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
    if (this.layer) {
      this.layer.addTo(map)
    } else {
      this.map = map
    }
  }

  /**
   * render a twig template. The following variables will be available: 'const' (the 'const' section from the stylesheet), 'layer_id' (the 'id' of the stylesheet, if it has any).
   * @param {string} template A twig template
   * @returns {string} The result
   */
  renderTemplate (template) {
    const t = OverpassLayer.twig.twig({ data: template, autoescape: true })

    const p = t.render({
      layer_id: this.id,
      'const': this.data.const
    })

    return p
  }
}

LeafletGeowiki.defaultValues = defaultValues

LeafletGeowiki.addExtension = (extension) => {
  extensions.push(extension)
}

ee(LeafletGeowiki.prototype)

module.exports = LeafletGeowiki
