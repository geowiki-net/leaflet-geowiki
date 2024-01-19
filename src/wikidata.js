import OverpassLayer from 'overpass-layer'

const callbacks = {}
const cache = {}

function wikidataLoad (id, callback) {
  if (id in cache) {
    return callback(null, cache[id])
  }

  if (id in callbacks) {
    return callbacks[id].push(callback)
  }
  callbacks[id] = [callback]

  fetch('https://www.wikidata.org/wiki/Special:EntityData/' + id + '.json')
    .then(req => req.json())
    .then(result => {
      if (!result.entities || !result.entities[id]) {
        console.log('invalid result', result)
        cache[id] = false
        return callback(new Error('invalid result'), null)
      }

      cache[id] = result.entities[id]

      callbacks[id].forEach(cb => cb(null, result.entities[id]))
      delete callbacks[id]
    })
    .catch(reason => {
      cache[id] = false

      global.setTimeout(() => {
        callbacks[id].forEach(cb => cb(reason))
        delete callbacks[id]
      })
    })
}

module.exports = {
  id: 'wikidata',
  load: wikidataLoad
}

OverpassLayer.twig.extendFilter('wikidataEntity', function (value, param) {
  const ob = global.currentMapFeature
  if (value in cache) {
    return cache[value]
  }

  wikidataLoad(value, () => {
    if (ob) {
      ob.recalc()
    }
  })

  return null
})
