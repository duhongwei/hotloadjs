define(['lego', './util'], function (lego, util) {
  'use strict';

  var handler = {
    js: function (path) {
      path = path + '?t=' + new Date().getTime();
      lego.load(path);
    }
  };
  function deal(filePath) {
    var match = filePath.match(/\.(\w+)$/);
    if (!match) {
      return false;
    }
    var subfix = match[1];

    window.setTimeout(function () {
      handler[subfix](filePath);
    }, 200);
  }
  function init(arg) {
    if (!window.WebSocket) {
      console.log('WebSocket no supported!');
      return;
    }
    var ws = new WebSocket(arg.socket.url);
    ws.onopen = function (e) {
      console.log("connection open ...");
      ws.send('ready');
    };
    ws.onmessage = function (e) {
      var data = JSON.parse(e.data);
      var message = '';
      var timeString = new Date().toTimeString().split(/\s+/)[0];
      if (data.type != 'data') {
        console.log(util.format('[{0}]\t{1}', data.type, data.data));
        return;
      }
      var filePath = data.data;
     
      if (lego.has(filePath)) {
        message = util.format('[apply]\t{0}\t{1}', filePath, timeString);
        deal(filePath);
      }
      else {
        message = util.format('[omit]\t{0}\t{1}', filePath, timeString)
      }
      console.log(message);
    };
    ws.onclose = function (e) {
      console.log('connection closed');
      if (e.data) {
        console.log(e.data)
      }
    };
  }

  return {
    init: init
  };
});