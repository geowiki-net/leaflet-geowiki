module.exports = [
  // Render map info into a div
  require('./src/info'),

  // List map features in a div
  require('./src/list'),

  // Render markers on the map
  require('./src/markers'),

  // Create additional panes to layer map features
  require('./src/panes'),

  // Query data from Wikidata
  require('./src/wikidata'),

  // Language support
  require('./src/language'),

  // Miscellaneous twig functions
  require('./src/twigFunctions'),

  // Translate tag values (with openstreetmap-tag-translations)
  require('./src/tagTranslations'),

  // Enable support for color functions
  require('geowiki-module-color'),

  // Enable support for parsing opening_hours tags
  require('geowiki-module-opening-hours'),

  // Evaluate an object against the current stylesheet to get the style (often used in map info)
  require('./src/evaluate'),
]
