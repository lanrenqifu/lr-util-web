/**
 * @file
 * webapp组件基础库文件，主要用于通用组件的类结构声明
 */

var util = require('./util');

var superclass = function(sp) {
  var s = function() {
    var name = (s.caller || {}).name;
    var len = arguments.length, t = this;
    var supper = arguments.callee.superclass;
    if (!name) {
      for(var n in t) {
        if(t[n] == s.caller) {
          name = n;
          break;
        }
      }
    }
    if(len > 0 && name) {
      var callArgs = Array.prototype.slice.call(arguments, 0);
      Array.prototype.splice.apply(callArgs, [0, 1]);
      return supper[name](callArgs);
    }
    return supper;
  }
  s.superclass = sp;
  return s;
};

function inherit(child, father) {
  var f = function() {},
    cp,
    fp = father.prototype;
  f.prototype = fp;
  cp = child.prototype = new f;
  cp.constructor = child;
  $.each(Array.prototype.slice.apply(arguments, [2]), function(index, item) {
    if(typeof item === "function") {
      item = item.prototype;
    }
    util.mixin(child.prototype, item);
  });
  cp.superclass = superclass(fp);
}


var define = module.exports = function() {
  var len = arguments.length,
    s = arguments[0],
    i = arguments[len - 1];
  var nc = typeof i.initialize == "function" ? i.initialize :
    function() {
      s.apply && s.apply(this, arguments);
    };
  if(len > 1) {
    var newArgs = [nc, s].concat(Array.prototype.slice.call(arguments).slice(1, len - 1), i);
    inherit.apply(null, newArgs);
  } else {
    nc.prototype = i;
    nc.prototype.constructor = nc;
  }
  return nc;
};