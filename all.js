import LeafletGeowiki from './src/LeafletGeowiki'
import './src/twigFunctions'

const modules = require('./modules')

LeafletGeowiki.modules = [...LeafletGeowiki.modules, ...modules]

module.exports = LeafletGeowiki
