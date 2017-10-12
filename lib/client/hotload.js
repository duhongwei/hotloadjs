/**
 * hotload.js 1.0.1 Released under MIT license
 * 2017.10.01
 * author:duhongwei
 */
(function (window) {
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
      if (window.console && window.console.log && isShowLog) {
        window.console.log(msg);
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
    return document.scripts[document.scripts.length - 1].src.split(/[?#]/)[0];
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

  function argHelper(key, deps, fun) {
    var errMsg = 'arguments error!';
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
    if (typeof key !== 'string') {
      var path = getLastScriptPath();
      key = getKey(path) || defaultGetKey();
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
      return true;
    }
    else {
      waitingMod.push(mod);
    }
    return false;
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
    if (excute(mod)) {
      dealWaiting();
    }
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
    getKey = deafultGetKey;
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
  var defaultGetKey = (function () {
    var index = 0;
    return function () {
      return 'k' + index++;
    }
  })();
  var getKey = defaultGetKey;
  function setConfig(_config_) {
    if (_config_.log) {
      logger.setConfig(_config_.log);
    }
    if (_config_.getKey) {
      getKey = _config_.getKey;
    }
  }
  function setLastReadyModuleKey(key) {
    readyMod.last.key = key;
  }
  function has(key) {
    return (key in readyMod);
  }
  function defineLegoMod() {
    define('lego', function () {
      return {
        version: '1.0.1',
        has: has,
        inspect: inspect,
        reset: reset,
        load: load,
        setConfig: setConfig,
        getKey: defaultGetKey,
        setLastReadyModuleKey: setLastReadyModuleKey
      };
    });
  }
  defineLegoMod();
  window.define = define;
  window.define.amd = {};
  window.require = require;
})(this);
