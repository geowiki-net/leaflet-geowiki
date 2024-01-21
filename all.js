import LeafletGeowiki from './src/LeafletGeowiki'
import './src/twigFunctions'

const modules = [
  require('./src/evaluate'),
  require('./src/info'),
  require('./src/list'),
  require('./src/markers'),
  require('./src/panes'),
  require('./src/wikidata'),
  require('./src/tagTranslations'),
  require('geowiki-module-opening-hours'),
]

LeafletGeowiki.modules = [...LeafletGeowiki.modules, ...modules]

module.exports = LeafletGeowiki
