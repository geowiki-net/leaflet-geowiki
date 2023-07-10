import LeafletGeowiki from './LeafletGeowiki'

LeafletGeowiki.addExtension({
  id: 'panes',
  initFun: (that, callback) => {
    that.once('layeradd', () => {
      if (that.data.panes) {
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
