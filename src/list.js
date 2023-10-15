import LeafletGeowiki from './LeafletGeowiki'
import OverpassLayer from 'overpass-layer'

LeafletGeowiki.addExtension({
  id: 'list',
  initFun: (that, callback) => {
    that.once('layeradd', (layer) => {
      if (that.options.list) {
        const list = new OverpassLayer.List(layer)
        list.addTo(that.options.list.dom)
      }
    })

    callback()
  }
})
