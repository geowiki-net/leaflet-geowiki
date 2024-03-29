const Twig = require('twig')
const colorInterpolate = require('color-interpolate')
const osmParseDate = require('openstreetmap-date-parser')
const osmFormatDate = require('openstreetmap-date-format')
const natsort = require('natsort').default
const md5 = require('md5')
const yaml = require('js-yaml')

const md5cache = {}

Twig.extendFunction('tagsPrefix', function (tags, prefix) {
  const ret = {}
  let count = 0

  for (const k in tags) {
    if (k.substr(0, prefix.length) === prefix) {
      ret[k.substr(prefix.length)] = k
      count++
    }
  }

  if (count === 0) {
    return null
  }

  return ret
})

Twig.extendFilter('websiteUrl', function (value) {
  if (value.match(/^https?:\/\//)) {
    return value
  }

  return 'http://' + value
})
Twig.extendFilter('matches', function (value, param) {
  if (value === null || typeof value === 'undefined') {
    return false
  }

  if (!param.length) {
    throw new Error("Filter 'matches' needs a parameter!")
  }

  const r = new RegExp(...param)
  return value.toString().match(r)
})
Twig.extendFilter('natsort', function (values, options) {
  return values.sort(natsort(options))
})
Twig.extendFilter('unique', function (values, options) {
  // source: https://stackoverflow.com/a/14438954
  function onlyUnique (value, index, self) {
    return self.indexOf(value) === index
  }
  return values.filter(onlyUnique)
})
Twig.extendFunction('colorInterpolate', function (map, value) {
  const colormap = colorInterpolate(map)
  return colormap(value)
})
Twig.extendFilter('osmParseDate', function (value) {
  return osmParseDate(value)
})
Twig.extendFilter('osmFormatDate', function (value, param) {
  return osmFormatDate(value, param.length ? param[0] : {})
})
Twig.extendFilter('md5', function (value) {
  if (!(value in md5cache)) {
    md5cache[value] = md5(value)
  }

  return md5cache[value]
})
function enumerate (list) {
  if (!list) {
    return ''
  }

  if (typeof list === 'string') {
    list = list.split(/;/g)
  }

  if (list.length > 2) {
    let result = lang_str.enumerate_start.replace('{0}', list[0]).replace('{1}', list[1])

    for (let i = 2; i < list.length - 1; i++) {
      result = lang_str.enumerate_middle.replace('{0}', result).replace('{1}', list[i])
    }

    return lang_str.enumerate_end.replace('{0}', result).replace('{1}', list[list.length - 1])
  } else if (list.length == 2) {
    return lang_str.enumerate_2.replace('{0}', list[0]).replace('{1}', list[1])
  } else if (list.length > 0) {
    return list[0]
  }

  return ''
}
Twig.extendFunction('enumerate', (list) => enumerate(list))
Twig.extendFilter('enumerate', (list) => enumerate(list))
Twig.extendFilter('ksort', (list) => {
  if (Array.isArray(list)) {
    return list
  }

  const keys = list._keys || Object.keys(list)
  keys.sort()
  const result = Object.assign({}, list)
  result._keys = keys
  return result
})
Twig.extendFunction('debug', function () {
  console.log.apply(null, arguments)
})
Twig.extendFilter('debug', function (value, param) {
  if (param) {
    console.log.apply(null, [value, ...param])
  } else {
    console.log(value)
  }
  return value
})
Twig.extendFilter('json_pp', function (value, param) {
  const options = param[0] || {}

  if (value === 'undefined') {
    return 'null'
  }

  value = twigClear(value)

  return JSON.stringify(value, null, 'indent' in options ? ' '.repeat(options.indent) : '  ')
})
Twig.extendFilter('yaml', function (value, param) {
  const options = param[0] || {}

  value = twigClear(value)

  return yaml.dump(value, options)
})

function twigClear (value) {
  if (value === null || typeof value !== 'object') {
    return value
  }

  const v = {}
  for (const k in value) {
    if (k !== '_keys') {
      v[k] = value[k]
    }
  }

  return v
}
