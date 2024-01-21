const modulekitLang = require('modulekit-lang')

module.exports = {
  id: 'language',
  layerInit (layer, callback) {
    modulekitLang.set(layer.options.language, {}, callback)
  }
}
