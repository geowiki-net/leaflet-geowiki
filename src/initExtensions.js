import each from 'async/each'

module.exports = function initExtensions (object, func, extensions, callback) {
  const loadableExtensions = Object.entries(extensions)
    .filter(([id, extension]) => {
      if (extension.done) {
        return false
      }

      if (extension.requireExtensions && extension.requireExtensions.length) {
        if (!extension.requireExtensions.filter(rId => extensions[rId] && extensions[rId].done).length) {
          return false
        }
      }

      return true
    })

  if (!loadableExtensions.length) {
    return callback()
  }

  each(loadableExtensions, ([id, extension], done) => {
    if (!extension[func]) {
      extension.done = true
      return done()
    }

    if (extension[func].length < 2) {
      try {
        extension[func](object)
      }
      catch (err) {
        console.log('error init', id, err)
        return done(err)
      }

      extension.done = true
      return done()
    }

    extension[func](object, (err) => {
      if (err) {
        console.log('error init', id, err)
        return done(err)
      }

      extension.done = true
      return done()
    })
  }, (err) => {
    if (err) { return callback(err) }
    initExtensions(object, func, extensions, callback)
  })
}
