const path = require('path')
const hotload = require('../lib/');
const config = require('./config')
hotload.socket.run(config);
hotload.server.run(config);