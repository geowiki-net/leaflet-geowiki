/* eslint camelcase:0 */
const LeafletGeowiki = require('./LeafletGeowiki')
LeafletGeowiki.defaultValues.feature.title = "{{ localizedTag(tags, 'name') |default(localizedTag(tags, 'operator')) | default(localizedTag(tags, 'ref')) }}"

const sprintf = require('sprintf-js')
const modulekitLang = require('modulekit-lang')
const OverpassLayer = require('overpass-layer')
let tagLang = null

OverpassLayer.twig.extendFunction('keyTrans', function () {
  return tagTranslationsTrans.call(this, arguments[0], undefined, arguments[1])
})
OverpassLayer.twig.extendFunction('tagTrans', function () {
  return tagTranslationsTrans.apply(this, arguments)
})
OverpassLayer.twig.extendFunction('tagTransList', function () {
  return tagTranslationsTransList.apply(this, arguments)
})
OverpassLayer.twig.extendFunction('localizedTag', function (tags, id) {
  if (tagLang && id + ':' + tagLang in tags) {
    return tags[id + ':' + tagLang]
  }

  return tags[id]
})
OverpassLayer.twig.extendFunction('trans', function () {
  return modulekitLang.lang.apply(this, arguments)
})
OverpassLayer.twig.extendFunction('isTranslated', function (str) {
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

module.exports = {
  id: 'tagTranslations',
  trans: tagTranslationsTrans,
  isTranslated: tagTranslationsIsTranslated,
  setTagLanguage: function (lang) {
    tagLang = lang
  }
}
