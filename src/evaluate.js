const OverpassLayer = require('overpass-layer')

let that = null

module.exports = {
  id: 'evaluate',
  layerInit: (_that, callback) => {
    _that.on('twigData', (data) => {
      that = _that
    })

    callback()
  }
}

OverpassLayer.twig.extendFunction('evaluate', function (tags) {
  const ob = {
    id: 'x0',
    meta: {},
    tags,
    type: 'special'
  }

  if (!that || !that.layers || !that.layers.length) {
    return console.log('something is not right', that)
  }

  return that.layers[0].mainlayer.evaluate(ob)
})
