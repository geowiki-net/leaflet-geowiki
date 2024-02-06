import each from 'async/each'

function getModule (modules, id) {
  if (typeof id === 'string') {
    const matching = modules.filter(m => m.id === id)
    return matching.length ? matching[0] : null
  }

  return id
}

function moduleId (module) {
  return module.id ?? module.name
}

module.exports = function initModules (object, func, modules, callback, doneModules = []) {
  const loadableModules = modules
    .filter(module => {
      if (doneModules.includes(module)) {
        return false
      }

      if (module.requireModules && module.requireModules.length) {
        if (!module.requireModules.filter(req => doneModules.includes(getModule(modules, req))).length) {
          return false
        }
      }

      return true
    })

  if (!loadableModules.length) {
    const notLoadedModules = modules
      .filter(module => !doneModules.includes(module))

    if (notLoadedModules.length) {
      return callback(new Error('Some modules not loaded due to missing dependencies: ' +
        notLoadedModules.map(module => {
          const missing = module.requireModules.filter(req => !doneModules.includes(getModule(modules, req)))
          return moduleId(module) + ' (' + missing.map(m => moduleId(m)).join(', ') + ')'
        }).join(', ')))
    }

    return callback()
  }

  each(loadableModules, (module, done) => {
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
