import OverpassLayer from 'overpass-layer'

const loadClash = {}
const cache = {}

function wikidataLoad (id, callback) {
  if (id in cache) {
    return callback(null, cache[id])
  }

  if (id in loadClash) {
    loadClash[id].push(callback)
    return
  }
  loadClash[id] = []

  fetch('https://www.wikidata.org/wiki/Special:EntityData/' + id + '.json')
    .then(req => req.json())
    .then(result => {
      if (!result.entities || !result.entities[id]) {
        console.log('invalid result', result)
        cache[id] = false
        return callback(err, null)
      }

      cache[id] = result.entities[id]

      callback(null, result.entities[id])

      loadClash[id].forEach(function (d) {
        d(null, result.entities[id])
      })
      delete loadClash[id]
    })
}

module.exports = {
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
