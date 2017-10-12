define('config', ['lego'], function (lego) {
  function getKey(scriptPath) {
    var match = scriptPath.match(/\/([^/]+)\.js$/);
    if (match) {
      return match[1];
    }
    else {
      return lego.getKey();
    }
  }
  lego.setConfig({
    getKey: getKey
  });
  return {
    getKey: getKey,
    socket: { url: 'ws://' + window.location.hostname + ':8341' }
  }
})