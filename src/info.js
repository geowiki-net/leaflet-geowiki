import LeafletGeowiki from './LeafletGeowiki'

LeafletGeowiki.addExtension({
  id: 'info',
  initFun: (that, callback) => {
    if (that.data.info) {
      render(that)
      that.on('zoomChange', () => render(that))
      that.on('layeradd', () => render(that))
      that.on('updateOptions', () => render(that))
    }
    
    callback()
  }
})

function render (that) {
  if (!that.options.info || !that.options.info.dom) { return }

  const content = that.renderTemplate(that.data.info)
  that.options.info.dom.innerHTML = content
}
