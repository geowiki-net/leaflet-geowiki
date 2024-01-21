const markers = require('openstreetbrowser-markers')
const Twig = require('twig')

Twig.extendFunction('markerLine', (data, options) => OverpassLayer.twig.filters.raw(markers.line(data, options)))
Twig.extendFunction('markerCircle', (data, options) => OverpassLayer.twig.filters.raw(markers.circle(data, options)))
Twig.extendFunction('markerPointer', (data, options) => OverpassLayer.twig.filters.raw(markers.pointer(data, options)))
Twig.extendFunction('markerPolygon', (data, options) => OverpassLayer.twig.filters.raw(markers.polygon(data, options)))

function updateImageSrc (img, src) {
  if (src.match(/^(marker):.*/)) {
    const m = src.match(/^(marker):([a-z0-9-_]*)(?:\?(.*))?$/)
    if (m) {
      const span = document.createElement('span')
      img.parentNode.insertBefore(span, img)
      img.parentNode.removeChild(img)
      let param = m[3] ? queryString.stringify(m[3]) : {}

      if (param.styles) {
        const newParam = { styles: param.styles }
        for (const k in param) {
          const m = k.match(/^(style|style:.*)?:([^:]*)$/)
          if (m) {
            if (!(m[1] in newParam)) {
              newParam[m[1]] = {}
            }
            newParam[m[1]][m[2]] = param[k]
          }
        }
        param = newParam
      }

      span.innerHTML = markers[m[2]](param)
    }
  }
}

module.exports = {
  id: 'markers',
  line: markers.line,
  circle: markers.circle,
  pointer: markers.pointer,
  polygon: markers.polygon,
  layerInit: (that, callback) => {
    that.on('updateImageSrc', updateImageSrc)
    that.on('defaultValues', defaultValues => {
      defaultValues.markerSymbol = '{{ markerPointer({})|raw }}'
      defaultValues.listMarkerSymbol = '{{ markerCircle({})|raw }}'
    })

    callback()
  }
}
