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
  it('hoload的函数的this 有 this.isHot 属性', function () {
    var hasIsHot = undefined
    define('apple1', function (apple) {
      hasIsHot = 'isHot' in this
      return 'apple';
    })
    expect(hasIsHot).equal(false)
    define('apple1', function () {
      hasIsHot = 'isHot' in this
      return 'bigapple'
    })
    expect(hasIsHot).equal(true)

  })
  it('reload event', function (done) {
    require('lego').on('reload', function (module) {
      if (module.key === 'apple12') {
        expect(module.funed).equal(2)
        done()
      }
    })
    define('apple12', function (apple) {
      return 1
    })
    define('apple12', function () {
      return 2
    })
  })
  //owner在闭包中不方便 reset 掉，beforeEach中执行的 lego.reset 没有把owner reset,导致模块加载后一直会保存。所以每个测试需要换一个特有的key
  //因为在浏览器加载模块后一般不需要卸载，所以就不做处理了，测试的时候注意下就好了。
  it('load event', function (done) {

    require('lego').on('load', function (module) {

      if (module.key === 'apple13') {

        expect(module.funed).equal(1)
        done()
      }
    })

    define('apple13', function (apple) {
      return 1
    })

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
  it('如果有load方法，执行load方法并恢复数据', function () {
    var count = 0;
    var preservedCount = 0
    define('apple', function (apple) {
      function addCount() {
        count++;
      }
      this.load = function (data) {
        preservedCount = data.count
      }
      this.unload = function () {
        return {
          count: count
        }

      }
      return addCount;
    })
    var addCount = require('apple');
    addCount();
    addCount();
    expect(count).equal(2);
    define('apple', function () { })
    expect(preservedCount).equal(2);
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

