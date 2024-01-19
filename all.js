import LeafletGeowiki from './src/LeafletGeowiki'
import './src/tagTranslations'
import './src/twigFunctions'

const extensions = [
  require('./src/evaluate'),
  require('./src/info'),
  require('./src/list'),
  require('./src/markers'),
  require('./src/panes'),
  require('./src/wikidata')
]

LeafletGeowiki.extensions = [...LeafletGeowiki.extensions, ...extensions]

module.exports = LeafletGeowiki
