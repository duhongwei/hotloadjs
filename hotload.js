/*!
 * hotloadjs v1.0.8
 * 
 * author: duhongwei
 * Released under the MIT license
 * Date: 2017
 */
(function (global) {
  'use strict';
  var waitingMod = [];
  var readyMod = {};
  var logger = (function () {
    var isShowLog = false;
    function setConfig(obj) {
      if (obj && obj.isShowLog) {
        isShowLog = true;
      }
      else {
        isShowLog = false;
      }
    }
    function log(msg) {
      if (global.console && global.console.log && isShowLog) {
        global.console.log(msg);
      }
    }
    function reset() {
      isShowLog = false;
    }
    return {
      setConfig: setConfig,
      log: log,
      reset: reset
    };
  })();
  var run = (function () {
    var owner = {};
    return function (mod) {
      var thisOwner = owner[mod.key] = owner[mod.key] || {};
      var preservedData = null;
      if (thisOwner.unload) {
        try {
          preservedData = thisOwner.unload();
        }
        catch (e) {
          logger.log(e);
        }
      }
      var funed = map(mod.deps, function (key) {
        return readyMod[key].funed;
      })
      mod.funed = mod.fun.apply(thisOwner, funed);
      if (preservedData && thisOwner.load) {
        try {
          thisOwner.load(preservedData);
        }
        catch (e) {
          logger.log(e);
        }
      }
      setDepKeys(mod);
    }

  })();
  var dealSubDependence = (function () {
    var allDepKeys = [];
    function getAllDepKeys(mod) {
      each(mod.depKeys, function (key) {
        if (find(allDepKeys, key) === undefined) {
          allDepKeys.push(key);
        }
        getAllDepKeys(readyMod[key]);
      })
    }
    return function (mod) {
      mod.depKeys = readyMod[mod.key].depKeys;
      delete readyMod[mod.key];
      if (mod.type === 'require') {
        return;
      }
      allDepKeys = [];
      getAllDepKeys(mod);
      logger.log('keys will update: ' + allDepKeys.join('\n'));
      each(allDepKeys, function (key) {
        var item = readyMod[key];
        delete readyMod[key];
        waitingMod.push(item);
      });
    }
  })();
  function find(arr, value) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === value) {
        return arr[i];
      }
    }
    return undefined;
  }
  function isArray(obj) {
    return Object.prototype.toString.call(obj) == "[object Array]";
  }
  function map(arr, cb) {
    var result = [];
    each(arr, function (item) {
      result.push(cb(item));
    });
    return result;
  }
  function each(obj, cb) {
    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
        if (cb(obj[i]) === false) {
          return;
        }
      }
    }
    else {
      for (var key in obj) {
        if (readyMod.hasOwnProperty(key)) {
          if (cb(obj[key]) === false) {
            return;
          }
        }
      }
    }
  }
  function getLastScriptPath() {
    var path = document.scripts[document.scripts.length - 1].src.split(/[?#]/)[0];
    if (!path) {
      return false;
    }
    var pathMatch = path.match(/^https?:\/\/[^/]+\/(.+)\.js$/)
    if (pathMatch) {
      path = pathMatch[1];
    }
    else {
      path = path.replace('.js', '');
    }
    return path;
  }
  function setDepKeys(mod) {
    each(mod.deps, function (key) {
      var depKeys = readyMod[key].depKeys;
      if (find(depKeys, mod.key) === undefined) {
        depKeys.push(mod.key);
      }
    });
  }

  function checkReady(mod) {
    for (var i = 0, deps = mod.deps; i < deps.length; i++) {
      if (!deps[i]) {
        continue;
      }
      if (!(deps[i] in readyMod)) {
        return false;
      }
    }
    return true;
  }

  function fixKey(key, path) {
    if (!path) {
      return key;
    }
    if (!/^\./.test(key)) {
      return key;
    }
    var upDepth = 1;
    var regMatch = key.match(/^(\.\.\/)+(.+)$/);
    if (regMatch) {
      upDepth = regMatch[0].split('../').length;
      key = regMatch[2];
    }
    if (/^\.\//.test(key)) {
      key = key.replace('./', '');
    }
    path = path.split('/');
    path.length = path.length - upDepth;

    key = path.join('/') + '/' + key;
    return key;
  }
  function argHelper(key, deps, fun) {
    if (isArray(key)) {
      fun = deps;
      deps = key;
    }
    else if (typeof key === 'function') {
      fun = key;
      deps = [];
    }
    else if (typeof deps === 'function') {
      fun = deps;
      deps = [];
    }
    if (!isArray(deps)) {
      throw 'dependence must be array'
    }
    var path = getLastScriptPath();
    if (typeof key !== 'string') {

      key = path || getDefaultKey();
    }
    for (var i = 0; i < deps.length; i++) {
      deps[i] = path ? fixKey(deps[i], path) : deps[i];
    }
    return {
      deps: deps,
      fun: fun,
      key: key
    };
  }
  function dealWaiting() {
    var i = waitingMod.length;
    var mod = null;
    // eslint-disable-next-line
    while (mod = waitingMod[--i]) {
      if (checkReady(mod)) {
        dealReady(mod);
        waitingMod.splice(i, 1);
        if (mod.type === 'define') {
          i = waitingMod.length;
        }
      }
    }
  }
  function dealReady(mod) {
    run(mod);
    if (mod.key in readyMod) {
      logger.log('hotload: ' + mod.key);
      dealSubDependence(mod);
    }
    else {
      setDepKeys(mod);
    }
    readyMod[mod.key] = mod;
    //for test
    readyMod.last = mod;
  }
  function excute(mod) {
    mod.depKeys = [];
    if (checkReady(mod)) {
      dealReady(mod);
      if (mod.type == 'define') {
        dealWaiting();
      }

    }
    else {
      waitingMod.push(mod);
    }

  }
  function require(key, deps, fun) {
    if (arguments.length === 1 && typeof key === 'string') {
      if (key in readyMod) {

        return readyMod[key].funed;
      }
      else {
        throw key + ' not found';
      }
    }
    var mod = argHelper(key, deps, fun);
    mod.type = 'require';
    excute(mod);
  }

  function define(key, deps, fun) {
    var mod = argHelper(key, deps, fun);
    mod.type = 'define';
    excute(mod);
  }
  function inspect() {
    return {
      waitingMod: waitingMod,
      readyMod: readyMod
    };
  }
  function reset() {
    waitingMod = [];
    readyMod = {};
    logger.reset();
    defineLegoMod();
  }
  function load(src, cb) {
    var script = document.createElement('script');
    script.src = src;
    if (cb) {
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          cb();
        }
      }
      script.onload = function () {
        cb();
      }
    }
    document.body.appendChild(script);
  }
  var getDefaultKey = (function () {
    var index = 0;
    return function () {
      return 'k' + index++;
    }
  })();

  function setConfig(_config_) {
    if (_config_.log) {
      logger.setConfig(_config_.log);
    }
  }

  function has(filePath) {
    var key = filePath.replace('.js', '');
    return (key in readyMod);
  }

  function defineLegoMod() {
    define('lego', function () {
      return {
        version: '1.0.8',
        has: has,
        inspect: inspect,
        reset: reset,
        load: load,
        setConfig: setConfig
      };
    });
  }
  defineLegoMod();
  global.define = define;
  global.define.amd = {};
  global.require = require;
})(this);
