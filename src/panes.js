import LeafletGeowiki from './LeafletGeowiki'
import OverpassLayer from 'overpass-layer'
import yaml from 'js-yaml'

LeafletGeowiki.addExtension({
  id: 'panes',
  initFun: (that, callback) => {
    that.once('layeradd', () => {
      if (that.data.panes) {
        if (typeof that.data.panes === 'string') {
          const template = OverpassLayer.twig.twig({ data: that.data.panes, autoescape: true })
          const p = template.render({})
          that.data.panes = yaml.load(p)
        }

        Object.entries(that.data.panes).forEach(([k, def]) => {
          const pane = that.map.createPane(k)

          if (typeof def === 'object') {
            Object.entries(def).forEach(([style, v]) => {
              pane.style[style] = v
            })
          }
        })
      }
    })

    callback()
  }
})
