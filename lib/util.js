/**
 * @file util group
 */
var
  /**
   * @desc util.createUniqueID的初始值
   * @type {number}
   */
  lastSeqId = 0,

  /**
   * 转义map
   */
  escapeMap = {
    "\b": '\\b',
    "\t": '\\t',
    "\n": '\\n',
    "\f": '\\f',
    "\r": '\\r',
    '"': '\\"',
    "\\": '\\\\'
  };

/**
 * @desc 转义日期对象 for util.jsonEncode
 * @param source
 * @returns {string}
 */
function encodeDate(source) {
  return ['"', +source, '"'].join("");
}

/**
 * @desc 转义数组对象 for util.jsonEncode
 * @param source
 * @returns {string}
 */
function encodeArray(source) {
  var result = ["["], l = source.length, preComma, i, item;
  for (i = 0; i < l; i++) {
    item = source[i];
    switch (typeof item) {
      case "undefined":
      case "function":
      case "unknown":
        break;
      default:
        if (preComma) {
          result.push(',');
        }
        result.push(util.jsonEncode(item));
        preComma = 1;
        break;
    }
  }
  result.push("]");
  return result.join("");
}

/**
 * @desc 转义字符串对象 for util.jsonEncode
 * @param source
 * @returns {string}
 */
function encodeString(source) {
  if (/["\\\x00-\x1f]/.test(source)) {
    source = source.replace(/["\\\x00-\x1f]/g, function (match) {
      var c = escapeMap[match];
      if (c) {
        return c;
      }
      c = match.charCodeAt();
      return "\\u00" +
        Math.floor(c / 16).toString(16) +
        (c % 16).toString(16);
    });
  }
  return ['"', source, '"'].join("");
}

var util = module.exports = {

  mixin: function (destination, source) {
    destination = destination || {};
    if(source) {
      for(var property in source) {
        var value = source[property];
        if(value !== undefined) {
          destination[property] = value;
        }
      }
      var sourceIsEvt = typeof window.Event == "function"
        && source instanceof window.Event;

      if (!sourceIsEvt && source.hasOwnProperty && source.hasOwnProperty("toString")) {
        destination.toString = source.toString;
      }
    }
    return destination;
  },

  /**
   * @method util.bind
   * @param func {Function}
   * @param object {Object}
   */
  bind: function(func, object) {
    // create a reference to all arguments past the second one
    var args = Array.prototype.slice.apply(arguments, [2]);
    return function() {
      // Push on any additional arguments from the actual function call.
      // These will come after those sent to the bind call.
      var newArgs = args.concat(
        Array.prototype.slice.apply(arguments, [0])
      );
      return func.apply(object, newArgs);
    };
  },

  /**
   * @method util.bindAsEventListener
   * @param func {Function} 作为事件监听的函数
   * @param object {Object} 作用域
   */
  bindAsEventListener: function(func, object) {
    return function(event) {
      return func.call(object, event || window.event);
    };
  },

  /**
   * @method util.createUniqueID
   * @param prefix {String} 前缀
   * @return {String} 全局唯一的一个字符串
   */
  createUniqueID: function(prefix) {
    prefix = (prefix === null || prefix === undefined) ? "pc_game_" : prefix.replace(/\./g, "_");
    return prefix + (lastSeqId++);
  },

  /**
   * @method util.g
   * @param el
   * @desc 靠id拿个节点 由于只是简单支持 没有必要写得那么高级
   */
  g: function(el) {
    var el = ('[object String]' == Object.prototype.toString.call(el) ?
      document.getElementById(el) : (!!(el && 'object' == typeof el) && el));
    return el || null;
  },

  /**
   * @method util.jsonEncode
   */
  jsonEncode: function(val) {
    switch (typeof val) {
      case 'undefined':
        return '""';
      case 'number':
        return ['"', val, '"'].join("");
      case 'string':
        return encodeString(val);
      case 'boolean':
        return ['"', val, '"'].join("");
      default:
        if(val === null) {
          return '""';
        } else if(val instanceof Array) {
          return encodeArray(val);
        } else if(val instanceof Date) {
          return encodeDate(val);
        } else {
          var result = ['{'], preComma, item;
          for (var key in val) {
            if (val.hasOwnProperty(key)) {
              item = val[key];
              switch(typeof item) {
                case 'undefined':
                case 'unknown':
                case 'function':
                  break;
                default:
                  if(preComma) {
                    result.push(',');
                  }
                  preComma = 1;
                  result.push(util.jsonEncode(key) + ':' + util.jsonEncode(item));
              }
            }
          }
          result.push('}');
          return result.join('');
        }
        break;
    }
  },

  /**
   * @param str
   * @returns {string}
   */
  trim: function(str) {
    str = String(str);
    return !!str.trim ? str.trim() : str.replace(new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g"), '');
  },

  /**
   * @decs method util.camelCase
   */
  camelCase: function(str) {
    str = util.trim(str);
    if (str.length === 1 || !(/[_.\- ]+/).test(str) ) {
      return str;
    }
    return str
      .replace(/^[_.\- ]+/, '')
      .replace(/[_.\- ]+(\w|$)/g, function (m, p1) {
        return p1.toUpperCase();
      });
  }
}