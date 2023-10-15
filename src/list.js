import LeafletGeowiki from './LeafletGeowiki'
import OverpassLayer from 'overpass-layer'

LeafletGeowiki.addExtension({
  id: 'list',
  initFun: (that, callback) => {
    that.once('layeradd', () => {
      if (that.options.list) {
        that.layers.forEach(layer => {
          const list = new OverpassLayer.List(layer)
          list.addTo(that.options.list.dom)
        })
      }
    })

    callback()
  }
})
