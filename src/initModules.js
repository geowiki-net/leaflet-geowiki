import each from 'async/each'

module.exports = function initModules (object, func, modules, callback, doneModules = []) {
  if (Array.isArray(modules)) {
    const _e = modules
    modules = {}
    _e.forEach((e, i) => {
      modules[e.id ?? i] = e
    })
  }

  const loadableModules = Object.entries(modules)
    .filter(([id, module]) => {
      if (doneModules.includes(module)) {
        return false
      }

      if (module.requireModules && module.requireModules.length) {
        if (!module.requireModules.filter(rId => doneModules.includes(modules[rId])).length) {
          return false
        }
      }

      return true
    })

  if (!loadableModules.length) {
    return callback()
  }

  console.log(loadableModules)
  each(loadableModules, ([id, module], done) => {
    if (!module[func]) {
      doneModules.push(module)
      return done()
    }

    if (module[func].length < 2) {
      try {
        module[func](object)
      } catch (err) {
        return done(err)
      }

      doneModules.push(module)
      return done()
    }

    module[func](object, (err) => {
      if (err) {
        console.log('error init', id, err)
        return done(err)
      }

      doneModules.push(module)
      return done()
    })
  }, (err) => {
    if (err) { return callback(err) }
    initModules(object, func, modules, callback, doneModules)
  })
}
