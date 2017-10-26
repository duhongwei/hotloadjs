/**
 * use mocha,chai to test me
 * https://github.com/mochajs/mocha
 * https://github.com/chaijs/chai
 */

var expect = window.chai.expect;

describe('参数', function () {
  beforeEach(function () {
    require('lego').reset();
  });
  it('只有key，模块存在，返回模块', function () {

  })
  it('完整参数', function () {
    define('apple', [], function () {
      return 'bigapple'
    });
    expect(require('apple')).equal('bigapple');
  })
  it('只有factory', function (done) {
    require('lego').load('./testjs/factoryonly.js', function () {
      require(['./factoryonly'], function (apple) {
        expect(apple).equal('bigapple')
        done();
      });
    })
  })
  it('依赖必须是数组', function () {
    var fun = function () {
      define('apple', 'abc', function () { })
    }
    expect(fun).throw();
    fun = function () {
      define('apple', [], function () { })
    }
    expect(fun).not.throw()
  })
  it('factory必须是函数', function () {
    var fun = function () {
      define('apple', {});
    }
    expect(fun).throw();
    fun = function () {
      define('apple', function () { })
    }
    expect(fun).not.throw()
  })

})

describe('key', function () {

  beforeEach(function () {
    require('lego').reset();
  });
  it('有key，直接用key标识模块', function () {
    define('apple', function () {
      return 'bigapple';
    })
    expect(require('apple')).equal('bigapple');
  })
  it('无key，同级目录通过相对路径获取模块', function (done) {
    var lego = require('lego');

    lego.load('./testjs/apple.js', function () {
      lego.load(['./testjs/getapple1.js'], function (apple) {
        expect(require('getapple1')).equal('bigapple');
        done();
      })
    });
  });
  it('无key，下级目录通过相对路径获取模块', function (done) {
    var lego = require('lego');

    lego.load('./testjs/apple.js', function () {
      lego.load(['./testjs/sub/getapple2.js'], function (apple) {
        expect(require('getapple2')).equal('bigapple');
        done();
      })
    });
  });
  it('无key，上级目录通过相对路径获取模块', function (done) {
    var lego = require('lego');
    lego.load('./testjs/sub/apple.js', function () {
      lego.load(['./testjs/getapple3.js'], function (apple) {
        expect(require('getapple3')).equal('bigapple');
        done();
      })
    });
  });
});
describe('AMD', function () {
  beforeEach(function () {
    require('lego').reset();
  });
  it('有上线，上线ready再执行', function () {
    define('plate', ['apple'], function (apple) {
      return apple;
    })
    define('apple', function () {
      return 'bigapple'
    })
    expect(require('plate')).equal('bigapple');
  })
  it('factory,执行并只执行一次', function () {
    var count = 0;
    define('plate', ['apple'], function () { });
    define('apple', function () {
      count++;
    })
    require('apple');
    require('plate')
    expect(count).equal(1);
  })
});

describe('hotload', function () {
  beforeEach(function () {
    require('lego').reset();
  });
  it('key相同触发hotload', function () {
    define('apple', function (apple) {
      return 'apple';
    })
    define('apple', function () {
      return 'bigapple'
    })
    expect(require('apple')).equal('bigapple');
  })
  it('如果有unload方法，执行unload方法', function () {
    var count = 0;
    define('apple', function (apple) {
      function addCount() {
        count++;
      }
      this.unload = function () {
        count = 0;
      }
      return addCount;
    })
    var addCount = require('apple');
    addCount();
    addCount();
    expect(count).equal(2);
    define('apple', function () { })
    expect(count).equal(0);
  })
  it('状态保持', function () {
    define('apple', function (apple) {
      var count = 0;
      function addCount() {
        count++;
      }

      function getCount() {
        return count;
      }
      this.unload = function () {
        return { count: count };
      }
      return {
        addCount,
        getCount
      }
    })
    var apple = require('apple');
    apple.addCount();
    apple.addCount();
    expect(apple.getCount()).equal(2);
    define('apple', function () {
      var count = 0;

      function getCount() {
        return count;
      }
      this.load = function (preservedData) {
        count = preservedData.count;
      }
      return {
        getCount: getCount
      }
    })
    expect(require('apple').getCount()).equal(2);
  })
});

