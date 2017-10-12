'use strict';
var WebSocket = require('ws');
var fs = require('fs');
var chokidar = require('chokidar');

var path = require('path');
function format(tpl) {
  var args = arguments;
  return tpl.replace(/{(\d)}/g, function () {
    return args[+arguments[1] + 1].toString();
  });
}

function run({ webRoot, socketRoot }) {
  var wss = new WebSocket.Server({ port: 8341, clientTracking: true });
  wss.on('error', function (e) {
    console.log(e.message);
  })
  var index = 0;
  wss.on('connection', function connection(ws) {
    var watcher = null;
    function sendMsg(msgObj) {
      ws.send(JSON.stringify(msgObj));
    }
    ws.on('message', function (msg) {
      if (msg != 'ready') {
        return;
      }
      var stat;
      try {
        stat = fs.statSync(socketRoot);
      }
      catch (e) {
        sendMsg({
          type: 'error',
          data: e.message
        });
        ws.close();
        return;
      }
      if (!stat.isDirectory()) {
        sendMsg({
          type: 'error',
          data: 'not a directory'
        });
        return;
      }
      if (watcher === null) {
        watcher = chokidar.watch(socketRoot, { ignored: /(^|[\/\\])\../ });
        watcher.on('change', filePath => ws.readyState === 1 && sendMsg({
          type: 'data',
          data: filePath.replace(webRoot, '')
        }));
        watcher.on('error', error => sendMsg({
          type: 'error',
          data: JSON.stringify(error)
        }));
      }
      else {
        sendMsg({
          type: 'error',
          data: 'expected client message'
        });
      }
    });
    ws.on('close', function (message) {
      watcher.unwatch(socketRoot);
      watcher.close();
    });
    sendMsg({
      type: 'info',
      data: 'ready,' + wss.clients.size + 'th'
    });
  });
  console.log('socket server running at ws://localhost:8341');
}

module.exports = {
  run
};