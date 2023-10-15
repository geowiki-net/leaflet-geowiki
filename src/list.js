import LeafletGeowiki from './LeafletGeowiki'
import OverpassLayer from 'overpass-layer'

LeafletGeowiki.addExtension({
  id: 'list',
  initFun: (that, callback) => {
    that.once('layeradd', () => {
      if (that.options.list) {
        const list = new OverpassLayer.List(that.layers)
        list.addTo(that.options.list.dom)
      }
    })

    callback()
  }
})
