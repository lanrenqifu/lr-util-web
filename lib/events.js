var define = require('./class');
var util = require('./util');

/**
 * 定义库内事件支撑
 * @namespace event
 * @type {object}
 */
var event = {

  /**
   * @property observers
   * @desc 一个缓存事件监听的hash表
   * @type {object}
   */
  observers: null,

  /**
   * @method octopus.event.element
   * @desc 返回事件的节点
   * @param e {window.event}
   * @return 触发事件的节点 {DOMElement}
   */
  element: function(e) {
    return e.target || e.srcElement;
  },

  /**
   * @method event.stop
   * @desc 把事件停了
   * @param e {window.event}
   * @param allowDefault {Boolean} -   是否把默认响应停了
   */
  stop: function(e, allowDefault) {
    if(!allowDefault) {
      if(e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }

    if(e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  },

  /**
   * @method event.on
   * @desc 监听事件
   * @param dom {String | DOMElement}
   * @param name {String}
   * @param fn {Function}
   * @param useCapture {Boolean}
   */
  on: function(dom, name, fn, useCapture) {
    var names = name.split(" "),
      len = names.length,
      i = len;
    if(len == 0)    return false;
    var element = util.g(dom),
      that = event;
    useCapture = useCapture || false;
    if(!that.observers) {
      that.observers = {};
    }
    if(!element._eventCacheID) {
      var idPrefix = "eventCacheID_";
      if (element.id) {
        idPrefix = element.id + "_" + idPrefix;
      }
      element._eventCacheID = util.createUniqueID(idPrefix);
    }
    for(; i--; ) {
      that._on(element, names[i], fn, useCapture);
    }
    return element;
  },

  /**
   * @private
   * @method event._on
   * @desc 监听事件
   * @param el {DOMElement}
   * @param name {String}
   * @param fn {Function}
   * @param useCapture {Boolean}
   */
  _on: function(el, name, fn, useCapture) {
    var cacheID = el._eventCacheID,
      that = event;
    if(!that.observers[cacheID]) {
      that.observers[cacheID] = [];
    }
    that.observers[cacheID].push({
      'element': el,
      'name': name,
      'observer': fn,
      'useCapture': useCapture
    });
    if(el.addEventListener) {
      el.addEventListener(name, fn, useCapture);
    } else if (el.attachEvent) {
      el.attachEvent('on' + name, fn);
    }
  },

  /**
   * @method event.stopObservingElement
   * @desc 把指定节点的所有事件监听停掉
   * @param dom {DOMElement}
   */
  stopObservingElement: function(dom) {
    var element = util.g(dom);
    var cacheID = element._eventCacheID;
    this._removeElementObservers(o.event.observers[cacheID]);
  },

  /**
   * @method event.stopEventObserver
   * @param dom {DOMElement}
   * @param e {String} 指定停掉的事件类型
   * @desc 此方法会将指定节点上的指定方法的所有事件监听停掉 慎用
   */
  stopEventObserver: function(dom, e) {
    var cacheID = util.g(dom)._eventCacheID,
      that = event,
      elementObservers = that.observers[cacheID];
    if (elementObservers) {
      var i = elementObservers.length;
      for(; i--; ) {
        var entry = elementObservers[i];
        if(e == entry.name) {
          var args = new Array(entry.element,
            entry.name,
            entry.observer,
            entry.useCapture);
          that.un.apply(this, args);
        }
      }
    }
  },

  /**
   * @private
   * @method _removeElementObservers
   * @desc具体做事情的方法
   * @param elementObservers {Array} 一堆事件缓存对象
   */
  _removeElementObservers: function(elementObservers) {
    if (elementObservers) {
      var i =  elementObservers.length;
      for( ; i--; ) {
        var entry = elementObservers[i];
        var args = new Array(entry.element,
          entry.name,
          entry.observer,
          entry.useCapture);
        event.un.apply(this, args);
      }
    }
  },

  /**
   * @method event.un
   * @desc 单删一个指定事件监听
   * @param dom {String | DOMElement}
   * @param name {String}
   * @param fn {Function}
   * @param useCapture {Boolean}
   * @return {Boolean} 返回解除监听是否成功
   */
  un: function(dom, name, fn, useCapture) {
    var names = name.split(" "),
      len = names.length,
      i = len;
    if(len == 0)    return false;
    var element = util.g(dom),
      cacheID = element._eventCacheID,
      foundEntry = false;
    useCapture = useCapture || false;
    for(; i--; ) {
      foundEntry = event._un(element, names[i], fn, useCapture, cacheID);
    }
    return foundEntry;
  },

  /**
   * @private
   * @method event._un
   * @desc 单删一个指定事件监听
   * @param el {DOMElement}
   * @param name {String}
   * @param fn {Function}
   * @param useCapture {Boolean}
   * @param id {String}
   * @return {Boolean} 返回解除监听是否成功
   */
  _un: function(el, name, fn, useCapture, id) {
    if(name == 'keypress') {
      if( navigator.appVersion.match(/Konqueror|Safari|KHTML/) ||
        el.detachEvent) {
        name = 'keydown';
      }
    }
    var foundEntry = false,
      elementObservers = event.observers[id];
    if (elementObservers) {
      var i=0;
      while(!foundEntry && i < elementObservers.length) {
        var cacheEntry = elementObservers[i];
        if ((cacheEntry.name == name) &&
          (cacheEntry.observer == fn) &&
          (cacheEntry.useCapture == useCapture)) {
          elementObservers.splice(i, 1);
          if (elementObservers.length == 0) {
            event.observers[id] = null;
          }
          foundEntry = true;
          break;
        }
        i++;
      }
    }
    if (foundEntry) {
      if (el.removeEventListener) {
        el.removeEventListener(name, fn, useCapture);
      } else if (el && el.detachEvent) {
        el.detachEvent('on' + name, fn);
      }
    }
    return foundEntry;
  },

  /**
   * @property unloadCache
   * @desc 页面销毁的时候希望可以释放掉所有监听
   */
  unloadCache: function() {
    if (event && event.observers) {
      for (var cacheID in event.observers) {
        var elementObservers = event.observers[cacheID];
        event._removeElementObservers.apply(this,
          [elementObservers]);
      }
      event.observers = false;
    }
  }
};

/**
 * @class Events
 * @desc 自定义事件类
 * @param object {Object} 观察订阅事件的对象 必需
 * @param fallThrough {Boolean}
 * @param options {Object}
 */
var Events = module.exports = define({

  /**
   * @private
   * @constant Events.BROWSER_EVENTS
   * @desc 常规的浏览器事件
   */
  BROWSER_EVENTS: [
    "mouseover", "mouseout", "mousedown", "mouseup", "mousemove",
    "click", "dblclick", "rightclick", "dblrightclick",
    "resize",
    "focus", "blur",
    "touchstart", "touchmove", "touchend",
    "keydown"
  ],

  /**
   * @private
   * @property listeners
   * @type {object}
   * @desc 事件监听的hash表
   */
  listeners: null,

  /**
   * @private
   * @property obj
   * @type {object}
   * @desc 事件对象所属的主体
   */
  obj: null,

  /**
   * @private
   * @constructor: Events.initialize
   * @param obj {Object} 观察订阅事件的对象 必需
   * @param options {Object}
   */
  initialize: function(obj, options) {
    util.mixin(this, options);
    this.obj = obj;
    this.listeners = {};
    if (this.el != null) {
      this.fallThrough = this.fallThrough || false;
      this.attachToElement();
    }
  },

  /**
   * @private
   * @method attachToElement
   * @param el {DOMElement}
   */
  attachToElement: function() {
    if (this.el) {
      event.stopObservingElement(this.el);
    } else {
      this.eventHandler = util.bindAsEventListener(this.handleBrowserEvent, this);
    }
    var i = 0,
      len = this.BROWSER_EVENTS.length;
    for (; i < len; i++) {
      event.on(this.BROWSER_EVENTS[i], this.eventHandler);
    }
    // 不去掉ie下会2掉
    event.on("dragstart", event.stop);
  },

  /**
   * @private
   * @method handleBrowserEvent
   * @desc 在指定dom节点的情况下 封装该dom触发的event属性
   */
  handleBrowserEvent: function(evt) {
    var type = evt.type,
      listeners = this.listeners[type];
    if(!listeners || listeners.length == 0) return;
    var touches = evt.touches;
    if (touches && touches[0]) {
      var x = 0,
        y = 0,
        num = touches.length,
        touch,
        i = 0;
      for (; i < num; ++i) {
        touch = touches[i];
        x += touch.clientX;
        y += touch.clientY;
      }
      evt.clientX = x / num;
      evt.clientY = y / num;
    }
    this.triggerEvent(type, evt);
  },

  /**
   * @method Events.destroy
   * @public
   * @desc 创建的事件对象自我解脱
   */
  destroy: function () {
    this.listeners = null;
    this.obj = null;
    this.fallThrough = null;
  },

  /**
   * @method Events.on
   * @public
   * @desc 添加自定义事件监听
   * @param type {String} 事件类型
   * @param func {Function} 回调
   * @param obj {Object} 事件绑定的对象 默认为this.object
   */
  on: function(type, func, obj) {
    if (func != null) {
      if (obj == null || obj == undefined)  {
        obj = this.obj;
      }
      var listeners = this.listeners[type];
      if (!listeners) {
        listeners = [];
        this.listeners[type] = listeners;
      }
      var listener = {obj: obj, func: func};
      listeners.push(listener);
    }
  },

  /**
   * @method Events.un
   * @public
   * @desc 取消自定义事件的监听
   * @param type {String} 事件类型
   * @param func {Function} 触发回调
   * @param obj {Object} 默认自身
   */
  un: function(type, func, obj) {
    if (obj == null)  {
      obj = this.obj;
    }
    var listeners = this.listeners[type];
    if (listeners != null) {
      for (var i=0, len=listeners.length; i<len; i++) {
        if (listeners[i].obj == obj && listeners[i].func == func) {
          listeners.splice(i, 1);
          break;
        }
      }
    }
  },

  /**
   * @method Events.triggerEvent
   * @desc 触发事件
   * @param type {String} 触发事件类型
   * @param evt {Object}
   */
  triggerEvent: function(type, evt) {
    var listeners = this.listeners[type];
    if(!listeners || listeners.length == 0) return undefined;
    if (evt == null) {
      evt = {};
    }
    evt.obj = this.obj;
    evt.el = this.el;
    if(!evt.type) {
      evt.type = type;
    }
    //clone一份
    listeners = listeners.slice();
    var continueChain,
      i = 0,
      len = listeners.length;
    for (; i < len; i++) {
      var callback = listeners[i];
      continueChain = callback.func.apply(callback.obj, [evt]);
      if (continueChain === false) {
        break;
      }
    }
    if (!this.fallThrough) {
      event.stop(evt);
    }
    return continueChain;
  },

  /**
   * @method Events.remove
   * @public
   * @desc 直接把指定事件类型的监听回调置空
   * @param type {String}
   */
  remove: function(type) {
    if (this.listeners[type] != null) {
      this.listeners[type] = [];
    }
  },

  /**
   * @method Events.register
   * @desc 批量增加事件
   * @param evs {Object}
   */
  register: function(evs) {
    for(var type in evs) {
      if(type != "scope" && evs.hasOwnProperty(type)) {
        this.on(type, evs[type], evs.scope);
      }
    }
  },

  /**
   * @method Events.unregister
   * @desc 批量去除事件
   * @param evs {Object}
   */
  unregister: function(evs) {
    for(var type in evs) {
      if(type != "scope" && evs.hasOwnProperty(type)) {
        this.un(type, evs[type], evs.scope);
      }
    }
  }
});