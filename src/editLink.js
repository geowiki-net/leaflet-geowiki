function editLinkRemote (type, osm_id) {
  const id = type.substr(0, 1) + osm_id

  global.overpassFrontend.get(
    id,
    {
      properties: global.overpassFrontend.OVERPASS_BBOX
    },
    (err, object) => {
      if (err) {
        return console.error(err)
      }

      const bounds = object.bounds

      const xhr = new XMLHttpRequest()
      const url = 'http://127.0.0.1:8111/load_and_zoom' +
        '?left=' + (bounds.minlon - 0.0001).toFixed(5) +
        '&right=' + (bounds.maxlon + 0.0001).toFixed(5) +
        '&top=' + (bounds.maxlat + 0.0001).toFixed(5) +
        '&bottom=' + (bounds.minlat - 0.0001).toFixed(5) +
        '&select=' + type + osm_id

      xhr.open('get', url, true)
      xhr.responseType = 'text'
      xhr.send()
    },
    (err) => {
      if (err) {
        alert(err)
      }
    }
  )
}

window.editLink = function (type, osm_id) {
  switch (global.options.editor) {
    case 'remote':
      editLinkRemote(type, osm_id)
      break
    case 'id':
    default:
      const url = global.config.urlOpenStreetMap + '/edit?editor=id&' + type + '=' + osm_id
      window.open(url)
  }

  return false
}

module.exports = function (object) {
  return '<a class="editLink" href="#edit" onclick="return editLink(\'' + object.object.type + '\', ' + object.object.osm_id + ')">' + lang('edit') + '</a>'
}
