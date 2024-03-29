import LeafletGeowiki from './src/LeafletGeowiki'

const modules = require('./modules')

LeafletGeowiki.modules = [...LeafletGeowiki.modules, ...modules]

module.exports = LeafletGeowiki
