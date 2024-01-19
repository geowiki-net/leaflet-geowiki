module.exports = {
  id: 'info',
  layerInit: (that, callback) => {
    console.log('info init')
    if (that.data.info) {
      that.on('zoomChange', () => render(that))
      that.on('layeradd', () => global.setTimeout(() => render(that), 0))
      that.on('updateOptions', () => render(that))
    }

    callback()
  }
}

function render (that) {
  if (!that.options.info || !that.options.info.dom) { return }

  const content = that.renderTemplate(that.data.info)
  that.options.info.dom.innerHTML = content
  that.updateAssets(that.options.info.dom)
}
