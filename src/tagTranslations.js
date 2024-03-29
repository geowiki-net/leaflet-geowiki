/* eslint camelcase:0 */
const sprintf = require('sprintf-js')
const modulekitLang = require('modulekit-lang')
const Twig = require('twig')
let tagLang = null

Twig.extendFunction('keyTrans', function () {
  return tagTranslationsTrans.call(this, arguments[0], undefined, arguments[1])
})
Twig.extendFunction('tagTrans', function () {
  return tagTranslationsTrans.apply(this, arguments)
})
Twig.extendFunction('tagTransList', function () {
  return tagTranslationsTransList.apply(this, arguments)
})
Twig.extendFunction('localizedTag', function (tags, id) {
  if (tagLang && id + ':' + tagLang in tags) {
    return tags[id + ':' + tagLang]
  }

  return tags[id]
})
Twig.extendFunction('trans', function () {
  return modulekitLang.lang.apply(this, arguments)
})
Twig.extendFunction('isTranslated', function (str) {
  return tagTranslationsIsTranslated(str)
})

function tagTranslationsIsTranslated (str) {
  return !(str in modulekitLang.lang_non_translated) && (str in modulekitLang.lang_str)
}

function tagTranslationsTrans () {
  const tag = arguments[0]
  let value
  let count
  if (arguments.length > 1) {
    value = arguments[1]
  }
  if (arguments.length > 2) {
    count = arguments[2]
  }

  if (typeof value === 'undefined') {
    return modulekitLang.lang('tag:' + tag, count)
  } else {
    return modulekitLang.lang('tag:' + tag + '=' + value, count)
  }
}

function tagTranslationsTransList (key, values) {
  if (typeof values === 'undefined') {
    return null
  }

  values = values.split(';')

  values = values.map(function (key, value) {
    return tagTranslationsTrans(key, value.trim())
  }.bind(this, key))

  return modulekitLang.enumerate(values)
}
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

module.exports = {
  id: 'tagTranslations',
  requireModules: ['language'],
  trans: tagTranslationsTrans,
  isTranslated: tagTranslationsIsTranslated,
  setTagLanguage: function (lang) {
    tagLang = lang
  },
  layerInit (layer) {
    layer.on('defaultValues', defaultValues => {
      defaultValues.feature.title = "{{ localizedTag(tags, 'name') |default(localizedTag(tags, 'operator')) | default(localizedTag(tags, 'ref')) }}"
    })
  }
}
