import each from 'async/each'

module.exports = function initExtensions (object, func, extensions, callback, doneExt = []) {
  if (Array.isArray(extensions)) {
    const _e = extensions
    extensions = {}
    _e.forEach((e, i) => {
      extensions[e.id ?? i] = e
    })
  }

  const loadableExtensions = Object.entries(extensions)
    .filter(([id, extension]) => {
      if (doneExt.includes(extension)) {
        return false
      }

      if (extension.requireExtensions && extension.requireExtensions.length) {
        if (!extension.requireExtensions.filter(rId => doneExt.includes(extensions[rId])).length) {
          return false
        }
      }

      return true
    })

  if (!loadableExtensions.length) {
    return callback()
  }

  console.log(loadableExtensions)
  each(loadableExtensions, ([id, extension], done) => {
    if (!extension[func]) {
      doneExt.push(extension)
      return done()
    }

    if (extension[func].length < 2) {
      try {
        extension[func](object)
      } catch (err) {
        return done(err)
      }

      doneExt.push(extension)
      return done()
    }

    extension[func](object, (err) => {
      if (err) {
        console.log('error init', id, err)
        return done(err)
      }

      doneExt.push(extension)
      return done()
    })
  }, (err) => {
    if (err) { return callback(err) }
    initExtensions(object, func, extensions, callback, doneExt)
  })
}
