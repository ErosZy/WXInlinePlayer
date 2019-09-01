// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/eventemitter3/index.js":[function(require,module,exports) {
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/node_modules/base64-js/index.js":[function(require,module,exports) {
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/node_modules/ieee754/index.js":[function(require,module,exports) {
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/node_modules/isarray/index.js":[function(require,module,exports) {
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/index.js":[function(require,module,exports) {

var global = arguments[3];
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/node_modules/base64-js/index.js","ieee754":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/node_modules/ieee754/index.js","isarray":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/node_modules/isarray/index.js","buffer":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/index.js"}],"util/ticker.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
var raf = function raf(callback, delay) {
  return setTimeout(callback, delay);
};

raf.cancel = function (handler) {
  clearTimeout(handler);
};

var Ticker =
/*#__PURE__*/
function () {
  function Ticker() {
    _classCallCheck(this, Ticker);

    this.ticks = 0;
    this.interval = 1000 / 60;
    this.lastTime = 0;
    this.callbacks = [];
    this.handler = null;

    this._setup();
  }

  _createClass(Ticker, [{
    key: "setFps",
    value: function setFps(fps) {
      if (fps) {
        this.interval = 1000 / fps;
      }
    }
  }, {
    key: "add",
    value: function add(func) {
      this.callbacks.push(func);
    }
  }, {
    key: "remove",
    value: function remove(func) {
      for (var i = this.callbacks.length - 1; i >= 0; i--) {
        if (this.callbacks[i] == func) {
          this.callbacks.splice(i, 1);
        }
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      raf.cancel(this.handler);
      this.handler = null;
      this.callbacks = [];
    }
  }, {
    key: "_setup",
    value: function _setup() {
      raf.cancel(this.handler);
      this.handler = raf(this._setup.bind(this), this.interval);

      if (this._getTime() - this.lastTime >= (this.interval - 1) * 0.97) {
        this._tick();
      }
    }
  }, {
    key: "_tick",
    value: function _tick() {
      this.lastTime = this._getTime();
      this.ticks++;

      if (this.callbacks.length) {
        for (var i = 0; i < this.callbacks.length; i++) {
          this.callbacks[i]();
        }
      }
    }
  }, {
    key: "_getTime",
    value: function _getTime() {
      if (window.performance && window.performance.now) {
        return window.performance.now();
      }

      return +new Date();
    }
  }]);

  return Ticker;
}();

var _default = Ticker;
exports.default = _default;
},{}],"util/util.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
var _default = {
  isWeChat: function isWeChat() {
    return /MicroMessenger/i.test(window.navigator.userAgent);
  },
  workerify: function workerify(func) {
    var methods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var funcStr = this.getFuncBody(func.toString());

    function __Worker__(data) {
      var _this = this;

      this.id = 0;
      this.resolves = [];
      var blob = new Blob([funcStr], {
        type: 'text/javascript'
      });
      this.url = URL.createObjectURL(blob);
      this.worker = new Worker(this.url);

      this.worker.onmessage = function (message) {
        var _message$data = message.data,
            id = _message$data.id,
            data = _message$data.data,
            destroy = _message$data.destroy;

        if (destroy) {
          _this.resolves = [];
          URL.revokeObjectURL(_this.url);

          _this.worker.terminate();

          _this.worker = null;
        } else {
          for (var i = _this.resolves.length - 1; i >= 0; i--) {
            if (id == _this.resolves[i].id) {
              _this.resolves[i].resolve(data);

              _this.resolves.splice(i, 1);

              break;
            }
          }
        }
      };

      this.worker.postMessage({
        type: 'constructor',
        id: this.id++,
        data: data
      });
    }

    var _loop = function _loop(i) {
      var type = methods[i];

      __Worker__.prototype[type] = function (data) {
        var _this2 = this;

        return new Promise(function (resolve, reject) {
          var id = _this2.id++;

          _this2.resolves.push({
            id: id,
            resolve: resolve,
            reject: reject
          });

          if (_this2.worker) {
            _this2.worker.postMessage({
              type: type,
              id: id,
              data: data
            });
          }
        });
      };
    };

    for (var i = 0; i < methods.length; i++) {
      _loop(i);
    }

    return __Worker__;
  },
  getFuncBody: function getFuncBody(funcStr) {
    return funcStr.trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
  }
};
exports.default = _default;
},{}],"sound/browser.js":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _buffer = require("buffer");

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var AudioContext = window.webkitAudioContext || window.AudioContext;

var BrowserSound =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(BrowserSound, _EventEmitter);

  function BrowserSound(_ref) {
    var _this;

    var volume = _ref.volume,
        muted = _ref.muted;

    _classCallCheck(this, BrowserSound);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BrowserSound).call(this));
    _this.duration = 0;
    _this.state = 'blocked';
    _this.blockedCurrTime = 0;
    _this.skimmedTime = 0;
    _this.vol = volume;
    _this.muted = muted;
    _this.context = new AudioContext();
    _this.gainNode = _this.context.createGain();
    _this.gainNode.gain.value = _this.muted ? 0.0 : _this.vol;

    _this.gainNode.connect(_this.context.destination);

    _this.audioSrcNodes = [];
    _this.playStartedAt = 0;
    _this.totalTimeScheduled = 0;
    _this.data = _buffer.Buffer.alloc(0);
    return _this;
  }

  _createClass(BrowserSound, [{
    key: "setBlockedCurrTime",
    value: function setBlockedCurrTime() {
      var currTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      this.blockedCurrTime = currTime;

      for (var i = 0; i < this.audioSrcNodes.length; i++) {
        var timestamp = this.audioSrcNodes[i].timestamp;

        if (currTime <= timestamp * 1000) {
          var nodes = this.audioSrcNodes.splice(0, !i ? 0 : i - 1);
          nodes.forEach(function (_ref2) {
            var source = _ref2.source;
            source.onended = null;
            source.disconnect();
          });
          break;
        }
      }
    }
  }, {
    key: "unblock",
    value: function unblock(offset) {
      if (this.state != 'blocked') {
        return;
      }

      this.state = 'running';
      this.context.resume();
      this.setBlockedCurrTime(offset);
      this.playStartedAt = 0;
      this.totalTimeScheduled = 0;

      for (var i = 0; i < this.audioSrcNodes.length; i++) {
        var _this$audioSrcNodes$i = this.audioSrcNodes[i],
            source = _this$audioSrcNodes$i.source,
            timestamp = _this$audioSrcNodes$i.timestamp,
            duration = _this$audioSrcNodes$i.duration;
        source.onended = null;
        source.disconnect();
        var audioSrc = this.context.createBufferSource();
        audioSrc.onended = this._onAudioBufferEnded.bind(this);

        if (!this.playStartedAt) {
          var _this$context = this.context,
              currentTime = _this$context.currentTime,
              baseLatency = _this$context.baseLatency,
              sampleRate = _this$context.sampleRate;
          var startDelay = duration + (baseLatency || 128 / sampleRate);
          this.playStartedAt = currentTime + startDelay;
        }

        audioSrc.buffer = source.buffer;

        try {
          audioSrc.connect(this.gainNode);
          audioSrc.start(this.totalTimeScheduled + this.playStartedAt, !i ? offset / 1000 - timestamp : 0);
        } catch (e) {}

        this.audioSrcNodes[i].source = audioSrc;
        this.audioSrcNodes[i].timestamp = this.totalTimeScheduled;
        this.totalTimeScheduled += duration;
      }
    }
  }, {
    key: "getAvaiableDuration",
    value: function getAvaiableDuration() {
      return this.duration;
    }
  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      if (this.context) {
        return this.state == 'blocked' ? this.blockedCurrTime : this.context.currentTime - this.playStartedAt + this.skimmedTime;
      }

      return 0.0;
    }
  }, {
    key: "volume",
    value: function volume(vol) {
      if (vol != null) {
        this.vol = vol;
        this.gainNode.gain.value = this.muted ? 0.0 : vol;
      }

      return this.vol;
    }
  }, {
    key: "mute",
    value: function mute(muted) {
      if (muted != null) {
        this.muted = muted;
        this.gainNode.gain.value = this.muted ? 0.0 : this.vol;
      }

      return this.muted;
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.context) {
        return this.context.suspend();
      }

      return Promise.resolve();
    }
  }, {
    key: "resume",
    value: function resume() {
      if (this.context) {
        return this.context.resume();
      }

      return Promise.resolve();
    }
  }, {
    key: "decode",
    value: function decode(data) {
      var _this2 = this;

      if (data.length) {
        data = _buffer.Buffer.from(data);
        this.data = _buffer.Buffer.concat([this.data, data]);

        if (this.context) {
          return new Promise(function (resolve) {
            _this2.context.decodeAudioData(_this2.data.buffer, function (buffer) {
              _this2._onDecodeSuccess(buffer);

              resolve();
            }, function (error) {
              _this2._onDecodeError(error);

              resolve();
            });
          });
        }
      }

      return Promise.resolve();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.removeAllListeners();

      if (this.context) {
        this.context.close();
        this.context = null;
      }

      this.data = null;
      this.gainNode = null;
      this.audioSrcNodes = [];
      this.state = 'destroy';
    }
  }, {
    key: "_onDecodeSuccess",
    value: function _onDecodeSuccess(audioBuffer) {
      var audioSrc = this.context.createBufferSource();
      audioSrc.onended = this._onAudioBufferEnded.bind(this);

      if (!this.playStartedAt) {
        var duration = audioBuffer.duration;
        var _this$context2 = this.context,
            currentTime = _this$context2.currentTime,
            baseLatency = _this$context2.baseLatency,
            sampleRate = _this$context2.sampleRate;
        var startDelay = duration + (baseLatency || 128 / sampleRate);
        this.playStartedAt = currentTime + startDelay;
      }

      audioSrc.buffer = audioBuffer;

      if (this.state == 'running') {
        try {
          audioSrc.connect(this.gainNode);
          audioSrc.start(this.totalTimeScheduled + this.playStartedAt);
        } catch (e) {}
      }

      this.audioSrcNodes.push({
        source: audioSrc,
        duration: audioBuffer.duration,
        timestamp: this.totalTimeScheduled
      });
      this.totalTimeScheduled += audioBuffer.duration;
      this.duration += audioBuffer.duration;
      this.data = _buffer.Buffer.alloc(0);
      this.emit('decode:success');
    }
  }, {
    key: "_onDecodeError",
    value: function _onDecodeError(e) {
      this.emit('decode:error', e);
    }
  }, {
    key: "_onAudioBufferEnded",
    value: function _onAudioBufferEnded() {
      var _this$audioSrcNodes$s = this.audioSrcNodes.shift(),
          source = _this$audioSrcNodes$s.source;

      source.disconnect();
    }
  }]);

  return BrowserSound;
}(_eventemitter.default);

var _default = BrowserSound;
exports.default = _default;
},{"buffer":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/index.js","eventemitter3":"../node_modules/eventemitter3/index.js"}],"sound/wechat.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _browser = _interopRequireDefault(require("./browser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var calls = [];
document.addEventListener('WeixinJSBridgeReady', function () {
  setTimeout(function loop() {
    if (calls.length) {
      WeixinJSBridge.invoke('getNetworkType', {}, calls.shift());
    }

    setTimeout(loop, 1000 / 60);
  }, 1000 / 60);
}, false);

var WeChatSound =
/*#__PURE__*/
function (_BrowserSound) {
  _inherits(WeChatSound, _BrowserSound);

  function WeChatSound(opt) {
    var _this;

    _classCallCheck(this, WeChatSound);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WeChatSound).call(this, opt));
    _this.state = 'running';

    _this.resume();

    return _this;
  }

  _createClass(WeChatSound, [{
    key: "setBlockedCurrTime",
    value: function setBlockedCurrTime() {
      /*--------Dont Need To Implemented-------*/

      var currTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    }
  }, {
    key: "unblock",
    value: function unblock(offset) {
      /*--------Dont Need To Implemented-------*/
    }
  }, {
    key: "volume",
    value: function volume(vol) {
      var _this2 = this;

      if (!vol) {
        return this.volume;
      }

      calls.push(function () {
        _get(_getPrototypeOf(WeChatSound.prototype), "volume", _this2).call(_this2, vol);
      });
    }
  }, {
    key: "mute",
    value: function mute(muted) {
      var _this3 = this;

      if (muted == null) {
        return this.muted;
      }

      calls.push(function () {
        _get(_getPrototypeOf(WeChatSound.prototype), "mute", _this3).call(_this3, muted);
      });
    }
  }, {
    key: "pause",
    value: function pause() {
      var _this4 = this;

      return new Promise(function (resolve) {
        calls.push(function () {
          _get(_getPrototypeOf(WeChatSound.prototype), "pause", _this4).call(_this4);

          resolve();
        });
      });
    }
  }, {
    key: "resume",
    value: function resume() {
      var _this5 = this;

      return new Promise(function (resolve) {
        calls.push(function () {
          _get(_getPrototypeOf(WeChatSound.prototype), "resume", _this5).call(_this5);

          resolve();
        });
      });
    }
  }]);

  return WeChatSound;
}(_browser.default);

var _default = WeChatSound;
exports.default = _default;
},{"./browser":"sound/browser.js"}],"sound/sound.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("../util/util"));

var _browser = _interopRequireDefault(require("./browser"));

var _wechat = _interopRequireDefault(require("./wechat"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
function Sound(opt) {
  return _util.default.isWeChat() ? new _wechat.default(opt) : new _browser.default(opt);
}

var _default = Sound;
exports.default = _default;
},{"../util/util":"util/util.js","./browser":"sound/browser.js","./wechat":"sound/wechat.js"}],"processor/processor.js":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _buffer2 = require("buffer");

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _ticker = _interopRequireDefault(require("../util/ticker"));

var _sound = _interopRequireDefault(require("../sound/sound"));

var _util = _interopRequireDefault(require("../util/util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Processor =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Processor, _EventEmitter);

  function Processor(_ref) {
    var _this;

    var _ref$volume = _ref.volume,
        volume = _ref$volume === void 0 ? 1.0 : _ref$volume,
        _ref$muted = _ref.muted,
        muted = _ref$muted === void 0 ? false : _ref$muted,
        _ref$preloadTime = _ref.preloadTime,
        preloadTime = _ref$preloadTime === void 0 ? 1000 : _ref$preloadTime,
        _ref$bufferingTime = _ref.bufferingTime,
        bufferingTime = _ref$bufferingTime === void 0 ? 3000 : _ref$bufferingTime,
        _ref$cacheSegmentCoun = _ref.cacheSegmentCount,
        cacheSegmentCount = _ref$cacheSegmentCoun === void 0 ? 128 : _ref$cacheSegmentCoun;

    _classCallCheck(this, Processor);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Processor).call(this));
    _this.soundHeadSliced = false;
    _this.framerate = 1000 / 24;
    _this.isEnded = false;
    _this.state = 'created';
    _this.baseTime = 0;
    _this.blocked = !_util.default.isWeChat();
    _this.hasVideo = true;
    _this.hasAudio = true;
    _this.frames = [];
    _this.audios = [];
    _this.currentTime = 0;
    _this.bufferingIndex = -1;
    _this.minBufferingTime = preloadTime;
    _this.bufferingTime = bufferingTime;
    _this.cacheSegmentCount = cacheSegmentCount;
    _this.ticker = new _ticker.default();
    _this.sound = new _sound.default({
      volume: volume,
      muted: muted
    });
    _this.codec = new H264Codec();
    _this.tickHandler = _this._onTickHandler.bind(_assertThisInitialized(_this));

    _this.ticker.add(_this.tickHandler);

    _this.codec.onmessage = _this._onCodecMsgHandler.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(Processor, [{
    key: "getAvaiableDuration",
    value: function getAvaiableDuration() {
      if (this.hasAudio) {
        if (this.sound) {
          return this.sound.getAvaiableDuration() * 1000;
        }
      }

      if (this.hasVideo) {
        if (this.frames.length) {
          return this.frames[this.frames.length - 1].timestamp;
        }
      }

      return 0;
    }
  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      if (this.hasAudio) {
        return this.sound ? this.sound.getCurrentTime() * 1000 : 0.0;
      } else if (this.hasVideo) {
        return this.currentTime;
      } else {
        return 0;
      }
    }
  }, {
    key: "process",
    value: function process(buffer) {
      if (this.codec) {
        this.codec.decode(buffer);
      }
    }
  }, {
    key: "unblock",
    value: function unblock() {
      if (_util.default.isWeChat()) {
        /*--------Dont Need To Implemented-------*/
      } else if (this.sound) {
        this.blocked = false;
        this.sound.unblock(0);
      }
    }
  }, {
    key: "volume",
    value: function volume(_volume) {
      if (_volume == null) {
        return this.sound ? this.sound.volume() : 0.0;
      } else {
        if (this.sound) {
          this.sound.volume(_volume);
        }
      }
    }
  }, {
    key: "mute",
    value: function mute(muted) {
      if (muted == null) {
        return this.sound ? this.sound.mute() : true;
      } else {
        if (this.sound) {
          this.sound.mute(muted);
        }
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.state == 'pasued') {
        return;
      }

      if (this.sound) {
        this.sound.pause();
      }

      if (this.ticker) {
        this.ticker.remove(this.tickHandler);
      }

      this.state = 'paused';
    }
  }, {
    key: "resume",
    value: function resume() {
      if (this.state == 'playing') {
        return;
      }

      this.state = 'playing';

      if (this.sound) {
        this.sound.resume();
      }

      if (this.ticker) {
        this.ticker.add(this.tickHandler);
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.removeAllListeners();

      if (this.ticker) {
        this.ticker.destroy();
        this.tickHandler = null;
      }

      if (this.sound) {
        this.sound.destroy();
      }

      if (this.codec) {
        this.codec.destroy();
      }

      this.frames = [];
      this.audios = [];
      this.ticker = null;
      this.sound = null;
      this.codec = null;
      this.state = 'destroy';
    }
  }, {
    key: "_onTickHandler",
    value: function _onTickHandler() {
      if (this.state == 'created') {
        return;
      }

      if (this.hasAudio && this.hasVideo) {
        var diff = 0;
        var lastIndex = 0;
        this.currentTime = this.getCurrentTime();

        if (this.frames.length) {
          lastIndex = this.frames.length - 1;
          var lastFrameTimestamp = this.frames[lastIndex].timestamp;

          if (this.bufferingIndex == -1) {
            this.bufferingIndex = lastIndex;
            diff = lastFrameTimestamp - this.currentTime;
          } else {
            var timestamp = this.frames[this.bufferingIndex].timestamp;
            diff = lastFrameTimestamp - timestamp;
          }
        }

        if (!this.frames.length || diff && diff < this.minBufferingTime) {
          if (this.state != 'buffering' && this.state != 'preload') {
            this.sound.pause();
            this.emit('buffering');
          }

          this.state = 'buffering';
          return;
        } else {
          if (this.currentTime) {
            this.minBufferingTime = this.bufferingTime;
          }

          this.bufferingIndex = -1;
          this.sound.resume();

          if (this.blocked || !this.currentTime) {
            return;
          }
        } // simple solution to delay accumulation


        if (this.frames.length >= this.cacheSegmentCount * 1.5) {
          this.ticker.setFps(this.framerate * 2);
        } else {
          this.ticker.setFps(this.framerate);
        }

        for (var i = 0; i < this.frames.length; i++) {
          var _timestamp2 = this.frames[i].timestamp;

          var _diff2 = this.currentTime - _timestamp2;

          if (Math.abs(_diff2) <= this.framerate) {
            this.emit('frame', this.frames[i]);
            this.frames.splice(0, i);
            break;
          }
        }
      } else if (this.hasAudio) {
        var duration = this.sound.getAvaiableDuration() * 1000;
        var bufferTime = this.bufferingTime;
        this.currentTime = this.getCurrentTime();

        if (this.state != 'preload' && this.currentTime > 0 && duration - this.currentTime < bufferTime) {
          this.state = 'preload';
          this.emit('preload');
        }
      } else if (this.hasVideo) {
        if (this.frames.length < this.cacheSegmentCount && !this.isEnded) {
          this.ticker.setFps(this.framerate / 2);
        }

        var frame = this.frames.shift();

        if (frame) {
          this.currentTime = frame.timestamp;
          this.emit('frame', frame);

          if (this.sound) {
            this.sound.setBlockedCurrTime(this.currentTime);
          }
        }
      }

      if (this.hasVideo && this.state != 'preload' && this.state != 'buffering' && this.frames.length < this.cacheSegmentCount) {
        this.state = 'preload';
        this.emit('preload');
      }
    }
  }, {
    key: "_onCodecMsgHandler",
    value: function _onCodecMsgHandler(msg) {
      var type = msg.type;

      switch (type) {
        case 'ready':
          {
            this.state = 'buffering';
            this.emit('buffering');
            break;
          }

        case 'header':
          {
            var _msg$data = msg.data,
                hasVideo = _msg$data.hasVideo,
                hasAudio = _msg$data.hasAudio;
            this.hasVideo = hasVideo;
            this.hasAudio = hasAudio;

            if (!this.hasAudio) {
              this.sound.destroy();
              this.sound = null;
            }

            this.emit('header', msg.data);
            break;
          }

        case 'mediaInfo':
          {
            try {
              msg.data = JSON.parse(msg.data);
            } catch (e) {}

            var info = msg.data['onMetaData'] || [];

            if (this.ticker) {
              for (var i = 0; i < info.length; i++) {
                var framerate = info[i].framerate;

                if (framerate) {
                  this.framerate = framerate;
                  this.ticker.setFps(framerate);
                  break;
                }
              }
            }

            this.emit('mediaInfo', msg.data);
            break;
          }

        case 'video':
          {
            var _msg$data2 = msg.data,
                timestamp = _msg$data2.timestamp,
                width = _msg$data2.width,
                height = _msg$data2.height,
                stride0 = _msg$data2.stride0,
                stride1 = _msg$data2.stride1,
                buffer = _msg$data2.buffer;

            if (!this.baseTime) {
              this.baseTime = timestamp;
            }

            this.frames.push({
              data: _buffer2.Buffer.from(new Uint8Array(buffer)),
              timestamp: timestamp - this.baseTime,
              width: width,
              height: height,
              stride0: stride0,
              stride1: stride1
            });
            break;
          }

        case 'audio':
          {
            var _msg$data3 = msg.data,
                _timestamp3 = _msg$data3.timestamp,
                _buffer = _msg$data3.buffer;

            if (!this.baseTime) {
              this.baseTime = _timestamp3;
            }

            this.audios.push(_buffer2.Buffer.from(new Uint8Array(_buffer)));
            break;
          }

        case 'decode':
          {
            if (this.state == 'buffering' || !this.hasVideo && this.hasAudio && this.state != 'playing') {
              this.emit('playing');
            }

            this.state = 'playing';
            this.ticker.setFps(this.framerate);

            if (this.hasAudio) {
              this.currentTime = this.getCurrentTime();

              if (!this.soundHeadSliced) {
                this.soundHeadSliced = true;

                if (this.frames.length) {
                  var frame = this.frames.shift();
                  this.emit('frame', frame);
                }

                this.sound.decode(_buffer2.Buffer.concat(this.audios.splice(0, 32)));
              }

              this.sound.decode(_buffer2.Buffer.concat(this.audios));
              this.audios = [];
            }

            break;
          }

        case 'complete':
          {
            this.isEnded = true;
            this.state = 'end';
            this.emit('end');
            break;
          }

        default:
          {
            break;
          }
      }
    }
  }]);

  return Processor;
}(_eventemitter.default);

var _default = Processor;
exports.default = _default;
},{"buffer":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/index.js","eventemitter3":"../node_modules/eventemitter3/index.js","../util/ticker":"util/ticker.js","../sound/sound":"sound/sound.js","../util/util":"util/util.js"}],"loader/stream.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
// see: https://github.com/qiaozi-tech/WXInlinePlayer/issues/8
function _default() {
  function concat(i, j) {
    var buffer = new Uint8Array(i.length + j.length);
    buffer.set(new Uint8Array(i), 0);
    buffer.set(new Uint8Array(j), i.length);
    return buffer;
  }

  function slice(buffer, startIndex, endIndex) {
    if (!endIndex || endIndex - startIndex > buffer.length) {
      endIndex = buffer.length;
    }

    return buffer.subarray(startIndex, endIndex);
  }

  function StreamLoader(_ref) {
    var url = _ref.url,
        _ref$chunkSize = _ref.chunkSize,
        chunkSize = _ref$chunkSize === void 0 ? 256 * 1024 : _ref$chunkSize;
    this.url = url;
    this.done = false;
    this.reader = null;
    this.chunkSize = chunkSize;
    this.data = new Uint8Array(0);
  }

  StreamLoader.prototype.hasData = function () {
    return !this.done || this.done && this.data.length;
  };

  StreamLoader.prototype.read = function () {
    var _this = this;

    if (this.data.length < this.chunkSize) {
      if (this.done) {
        return this._getChunk();
      }

      return this._request().then(function () {
        return _this._getChunk();
      });
    }

    return this._getChunk();
  };

  StreamLoader.prototype.cancel = function () {
    this.data = null;
    this.reader = null;
    this.done = true;
  };

  StreamLoader.prototype._getChunk = function () {
    var _this2 = this;

    return new Promise(function (resolve) {
      var buffer = slice(_this2.data, 0, _this2.chunkSize);
      _this2.data = slice(_this2.data, _this2.chunkSize);
      resolve(buffer);
    });
  };

  StreamLoader.prototype._request = function () {
    var _this3 = this;

    if (this.reader) {
      return this.reader.read().then(function (result) {
        var value = result.value,
            done = result.done;
        value = new Uint8Array(value ? value : 0);
        _this3.data = concat(_this3.data, value);

        if (done) {
          _this3.done = true;
        } else if (_this3.data.length < _this3.chunkSize) {
          return _this3._request();
        }
      });
    } else {
      return fetch(this.url, {
        method: 'GET'
      }).then(function (resp) {
        _this3.reader = resp.body.getReader();
        return _this3._request();
      });
    }
  };

  var loader = null;

  self.onmessage = function (message) {
    var _message$data = message.data,
        type = _message$data.type,
        id = _message$data.id,
        data = _message$data.data;

    if (type == 'constructor') {
      loader = new StreamLoader(data);
      self.postMessage({
        id: id
      });
    } else if (type == 'hasData') {
      self.postMessage({
        id: id,
        data: !loader ? false : loader.hasData()
      });
    } else if (type == 'read') {
      if (loader) {
        loader.read().then(function (data) {
          data = new Uint8Array(data);
          self.postMessage({
            id: id,
            data: data
          }, [data.buffer]);
        });
      } else {
        self.postMessage({
          id: id,
          data: new Uint8Array(0)
        });
      }
    } else if (type == 'cancel') {
      if (loader) {
        loader.cancel();
      }

      self.postMessage({
        id: id,
        destroy: true
      });
    }
  };
}
},{}],"loader/chunk.js":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _buffer = require("buffer");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var MAX_REQ_RETRY = 3;

var ChunkLoader =
/*#__PURE__*/
function () {
  function ChunkLoader(_ref) {
    var url = _ref.url,
        _ref$chunkSize = _ref.chunkSize,
        chunkSize = _ref$chunkSize === void 0 ? 256 * 1024 : _ref$chunkSize;

    _classCallCheck(this, ChunkLoader);

    this.url = url;
    /*this.cacheInMemory = cacheInMemory;*/

    this.chunkSize = chunkSize;
    this.startIndex = 0;
    this.downloadSize = 0;
    this.done = false;
    this.xhr = null;
  }

  _createClass(ChunkLoader, [{
    key: "hasData",
    value: function hasData() {
      return !this.done;
    }
  }, {
    key: "read",
    value: function read() {
      if (!this.done) {
        return this._request();
      }

      return Promise.resolve(new _buffer.Buffer(0));
    }
  }, {
    key: "cancel",
    value: function cancel() {
      if (this.xhr) {
        this.xhr.abort();
        this.xhr = null;
      }

      this.done = true;
    }
  }, {
    key: "_request",
    value: function _request() {
      var _this = this;

      var isSuccess = false;

      var promise = this._fetch();

      var _loop = function _loop(i) {
        promise = promise.then(function (buffer) {
          if (!isSuccess) {
            isSuccess = true;
            _this.downloadSize += buffer.length;

            if (buffer.length < _this.chunkSize) {
              _this.done = true;
            }
          }

          return buffer;
        }).catch(function (e) {
          if (i >= MAX_REQ_RETRY - 1) {
            throw e;
          } else {
            return _this._fetch();
          }
        });
      };

      for (var i = 0; i < MAX_REQ_RETRY; i++) {
        _loop(i);
      }

      return promise;
    }
  }, {
    key: "_fetch",
    value: function _fetch() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var endIndex = _this2.startIndex + _this2.chunkSize;
        _this2.xhr = new XMLHttpRequest();

        _this2.xhr.open('GET', _this2.url);

        _this2.xhr.responseType = 'arraybuffer';

        _this2.xhr.setRequestHeader('Range', "bytes=".concat(_this2.startIndex, "-").concat(endIndex));

        _this2.xhr.onerror = reject;

        _this2.xhr.onload = function () {
          if (_this2.xhr.readyState == 4) {
            if (_this2.xhr.status >= 200 && _this2.xhr.status <= 299) {
              _this2.startIndex = endIndex + 1;
              resolve(new Uint8Array(_this2.xhr.response));
            } else {
              reject(new Error("error status: ".concat(_this2.xhr.status)));
            }
          }
        };

        _this2.xhr.send();
      });
    }
  }]);

  return ChunkLoader;
}();

var _default = ChunkLoader;
exports.default = _default;
},{"buffer":"../../../../../../usr/local/lib/node_modules/parcel-bundler/node_modules/_buffer@4.9.1@buffer/index.js"}],"loader/loader.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _stream = _interopRequireDefault(require("./stream"));

var _chunk = _interopRequireDefault(require("./chunk"));

var _util = _interopRequireDefault(require("../util/util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
function Loader(_ref) {
  var _ref$type = _ref.type,
      type = _ref$type === void 0 ? 'chunk' : _ref$type,
      opt = _ref.opt;
  return type == 'chunk' ? new _chunk.default(opt) : new (_util.default.workerify(_stream.default, ['read', 'cancel', 'hasData']))(opt);
}

var _default = Loader;
exports.default = _default;
},{"./stream":"loader/stream.js","./chunk":"loader/chunk.js","../util/util":"util/util.js"}],"drawer/drawer.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
var Drawer =
/*#__PURE__*/
function () {
  function Drawer($canvas) {
    _classCallCheck(this, Drawer);

    this.$canvas = $canvas;
    this.contextGL = null;
    this.shaderProgram = null;
    this.texturePosBuffer = null;
    this.yTextureRef = null;
    this.uTextureRef = null;
    this.vTextureRef = null;

    this._initContextGL();

    if (this.contextGL) {
      this._initProgram();

      this._initBuffers();

      this._initTextures();
    }
  }

  _createClass(Drawer, [{
    key: "drawNextOutputPicture",
    value: function drawNextOutputPicture(width, height, data) {
      var yTextureRef = this.yTextureRef,
          uTextureRef = this.uTextureRef,
          vTextureRef = this.vTextureRef;
      var gl = this.contextGL;
      gl.viewport(0, 0, width, height);
      var i420Data = data;
      var yDataLength = width * height;
      var yData = i420Data.subarray(0, yDataLength);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);
      var cbDataLength = width / 2 * height / 2;
      var cbData = i420Data.subarray(yDataLength, yDataLength + cbDataLength);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width / 2, height / 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, cbData);
      var crDataLength = cbDataLength;
      var crData = i420Data.subarray(yDataLength + cbDataLength, yDataLength + cbDataLength + crDataLength);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width / 2, height / 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, crData);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      try {
        this.contextGL.getExtension('WEBGL_lose_context').loseContext();
      } catch (e) {}

      this.$canvas = null;
      this.contextGL = null;
      this.shaderProgram = null;
      this.texturePosBuffer = null;
      this.yTextureRef = null;
      this.uTextureRef = null;
      this.vTextureRef = null;
    }
  }, {
    key: "_initContextGL",
    value: function _initContextGL() {
      var canvas = this.$canvas;
      var validContextNames = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
      var gl = null;
      var nameIndex = 0;

      while (!gl && nameIndex < validContextNames.length) {
        var contextName = validContextNames[nameIndex];

        try {
          gl = canvas.getContext(contextName);
        } catch (e) {
          gl = null;
        }

        if (!gl || typeof gl.getParameter !== 'function') {
          gl = null;
        }

        ++nameIndex;
      }

      this.contextGL = gl;
    }
  }, {
    key: "_initProgram",
    value: function _initProgram() {
      var gl = this.contextGL;
      var vertexShaderScript = "\n    attribute vec4 vertexPos;\n    attribute vec4 texturePos;\n    varying vec2 textureCoord;\n    void main(){\n        gl_Position = vertexPos; \n        textureCoord = texturePos.xy;\n    }\n    ";
      var fragmentShaderScript = "\n    precision highp float;\n    varying highp vec2 textureCoord;\n    uniform sampler2D ySampler;\n    uniform sampler2D uSampler;\n    uniform sampler2D vSampler;\n    const mat4 YUV2RGB = mat4(\n        1.1643828125, 0, 1.59602734375, -.87078515625,\n        1.1643828125, -.39176171875, -.81296875, .52959375,\n        1.1643828125, 2.017234375, 0, -1.081390625,\n        0, 0, 0, 1\n    );\n\n    void main(void) {\n        highp float y = texture2D(ySampler,  textureCoord).r;\n        highp float u = texture2D(uSampler,  textureCoord).r;\n        highp float v = texture2D(vSampler,  textureCoord).r;\n        gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;\n    }\n    ";
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderScript);
      gl.compileShader(vertexShader);

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader));
      }

      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderScript);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader));
      }

      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('Program failed to compile: ' + gl.getProgramInfoLog(program));
      }

      gl.useProgram(program);
      this.shaderProgram = program;
    }
  }, {
    key: "_initBuffers",
    value: function _initBuffers() {
      var gl = this.contextGL;
      var program = this.shaderProgram;
      var vertexPosBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);
      var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
      gl.enableVertexAttribArray(vertexPosRef);
      gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);
      var texturePosBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
      var texturePosRef = gl.getAttribLocation(program, 'texturePos');
      gl.enableVertexAttribArray(texturePosRef);
      gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);
      this.texturePosBuffer = texturePosBuffer;
    }
  }, {
    key: "_initTextures",
    value: function _initTextures() {
      var gl = this.contextGL;
      var program = this.shaderProgram;

      var yTextureRef = this._initTexture();

      var ySamplerRef = gl.getUniformLocation(program, 'ySampler');
      gl.uniform1i(ySamplerRef, 0);
      this.yTextureRef = yTextureRef;

      var uTextureRef = this._initTexture();

      var uSamplerRef = gl.getUniformLocation(program, 'uSampler');
      gl.uniform1i(uSamplerRef, 1);
      this.uTextureRef = uTextureRef;

      var vTextureRef = this._initTexture();

      var vSamplerRef = gl.getUniformLocation(program, 'vSampler');
      gl.uniform1i(vSamplerRef, 2);
      this.vTextureRef = vTextureRef;
    }
  }, {
    key: "_initTexture",
    value: function _initTexture() {
      var gl = this.contextGL;
      var textureRef = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textureRef);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return textureRef;
    }
  }], [{
    key: "isSupport",
    value: function isSupport() {
      var canvas = document.createElement('canvas');
      var validContextNames = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
      var gl = null;
      var nameIndex = 0;

      while (!gl && nameIndex < validContextNames.length) {
        var contextName = validContextNames[nameIndex];

        try {
          gl = canvas.getContext(contextName);
        } catch (e) {
          gl = null;
        }

        if (!gl || typeof gl.getParameter !== 'function') {
          gl = null;
        }

        ++nameIndex;
      }

      return !!gl;
    }
  }]);

  return Drawer;
}();

var _default = Drawer;
exports.default = _default;
},{}],"index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _processor = _interopRequireDefault(require("./processor/processor"));

var _loader = _interopRequireDefault(require("./loader/loader"));

var _drawer = _interopRequireDefault(require("./drawer/drawer"));

var _util = _interopRequireDefault(require("./util/util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var WXInlinePlayer =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(WXInlinePlayer, _EventEmitter);

  function WXInlinePlayer(_ref) {
    var _this;

    var _ref$url = _ref.url,
        url = _ref$url === void 0 ? '' : _ref$url,
        $container = _ref.$container,
        _ref$hasVideo = _ref.hasVideo,
        hasVideo = _ref$hasVideo === void 0 ? true : _ref$hasVideo,
        _ref$hasAudio = _ref.hasAudio,
        hasAudio = _ref$hasAudio === void 0 ? true : _ref$hasAudio,
        _ref$volume = _ref.volume,
        volume = _ref$volume === void 0 ? 1.0 : _ref$volume,
        _ref$muted = _ref.muted,
        muted = _ref$muted === void 0 ? false : _ref$muted,
        _ref$autoplay = _ref.autoplay,
        autoplay = _ref$autoplay === void 0 ? false : _ref$autoplay,
        _ref$loop = _ref.loop,
        loop = _ref$loop === void 0 ? false : _ref$loop,
        _ref$isLive = _ref.isLive,
        isLive = _ref$isLive === void 0 ? false : _ref$isLive,
        _ref$chunkSize = _ref.chunkSize,
        chunkSize = _ref$chunkSize === void 0 ? 256 * 1024 : _ref$chunkSize,
        _ref$preloadTime = _ref.preloadTime,
        preloadTime = _ref$preloadTime === void 0 ? 1e3 : _ref$preloadTime,
        _ref$bufferingTime = _ref.bufferingTime,
        bufferingTime = _ref$bufferingTime === void 0 ? 3e3 : _ref$bufferingTime,
        _ref$cacheSegmentCoun = _ref.cacheSegmentCount,
        cacheSegmentCount = _ref$cacheSegmentCoun === void 0 ? 128 : _ref$cacheSegmentCoun,
        _ref$customLoader = _ref.customLoader,
        customLoader = _ref$customLoader === void 0 ? null : _ref$customLoader;

    _classCallCheck(this, WXInlinePlayer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WXInlinePlayer).call(this));
    _this.url = url;
    _this.$container = $container;
    _this.width = $container.width;
    _this.height = $container.height;
    _this.vol = volume;
    _this.muted = muted;
    _this.duration = 0;
    _this.autoplay = autoplay;
    _this.loop = loop;
    _this.isLive = isLive;
    _this.chunkSize = chunkSize;
    _this.preloadTime = preloadTime;
    _this.bufferingTime = bufferingTime;
    _this.cacheSegmentCount = cacheSegmentCount;
    /*this.cacheInMemory = cacheInMemory;*/

    _this.customLoader = customLoader;
    _this.timeUpdateTimer = null;
    _this.isInitlize = false;
    _this.isEnd = false;
    _this.state = 'created';

    if ((hasVideo && !hasAudio || _util.default.isWeChat()) && _this.autoplay) {
      _this._initlize();

      _this.processor.unblock(0);
    }

    return _this;
  }

  _createClass(WXInlinePlayer, [{
    key: "play",
    value: function play() {
      if (this.state != 'destroy' && !this.isInitlize) {
        this._initlize();

        this.processor.unblock(0);
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      this.state = 'stopped';
      this.isInitlize = false;
      clearInterval(this.timeUpdateTimer);

      if (this.processor) {
        this.processor.destroy();
        this.processor = null;
      }

      if (this.loader) {
        this.loader.cancel();
      }

      this.emit('stopped');
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.isLive) {
        this.stop();
      } else {
        if (this.processor) {
          this.state = 'paused';
          this.processor.pause();
        }
      }
    }
  }, {
    key: "resume",
    value: function resume() {
      if (this.isLive) {
        this.play();
      } else {
        if (this.processor) {
          this.processor.resume();
        }
      }
    }
  }, {
    key: "volume",
    value: function volume(_volume) {
      if (this.processor) {
        return this.processor.volume(_volume);
      }
    }
  }, {
    key: "mute",
    value: function mute(muted) {
      if (this.processor) {
        return this.processor.mute(muted);
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.state = 'destroy';
      this.removeAllListeners();
      this.stop();

      if (this.drawer) {
        this.drawer.destroy();
        this.drawer = null;
      }
    }
  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      if (this.processor) {
        return this.processor.getCurrentTime();
      } else {
        return 0.0;
      }
    }
  }, {
    key: "getAvaiableDuration",
    value: function getAvaiableDuration() {
      if (this.processor) {
        return this.processor.getAvaiableDuration();
      }

      return 0;
    }
  }, {
    key: "_initlize",
    value: function _initlize() {
      var _this2 = this;

      clearInterval(this.timeUpdateTimer);
      this.timeUpdateTimer = setInterval(function () {
        var currentTime = 0.0;

        if (_this2.processor) {
          currentTime = _this2.processor.getCurrentTime();
        }

        _this2.emit('timeUpdate', currentTime < 0 ? 0.0 : currentTime);

        if (_this2.isEnd) {
          if (_this2.processor.hasAudio && currentTime >= _this2.duration || _this2.processor.hasVideo && !_this2.processor.frames.length) {
            _this2.emit('end');

            _this2.stop();

            if (_this2.loop) {
              _this2.play();
            }
          }
        }
      }, 250);
      this.isEnd = false;
      this.drawer = new _drawer.default(this.$container);
      this.loader = new (this.customLoader ? this.customLoader : _loader.default)({
        type: this.isLive ? 'stream' : 'chunk',
        opt: {
          url: this.url,
          chunkSize: this.chunkSize
          /*cacheInMemory: this.cacheInMemory*/

        }
      });
      this.processor = new _processor.default({
        volume: this.vol,
        muted: this.muted,
        preloadTime: this.preloadTime,
        bufferingTime: this.bufferingTime,
        cacheSegmentCount: this.cacheSegmentCount
      });
      this.processor.on('mediaInfo', this._onMediaInfoHandler.bind(this));
      this.processor.on('frame', this._onFrameHandler.bind(this));
      this.processor.on('buffering', this._onBufferingHandler.bind(this));
      this.processor.on('preload', this._onPreloadHandler.bind(this));
      this.processor.on('playing', this._onPlayingHandler.bind(this));
      this.processor.on('end', this._onEndHandler.bind(this));
      this.isInitlize = true;
    }
  }, {
    key: "_onMediaInfoHandler",
    value: function _onMediaInfoHandler(mediaInfo) {
      var onMetaData = mediaInfo.onMetaData;

      for (var i = 0; i < onMetaData.length; i++) {
        if ('duration' in onMetaData[i]) {
          this.duration = onMetaData[i].duration * 1000;
        } else if ('width' in onMetaData[i]) {
          this.width = onMetaData[i].width;
        } else if ('height' in onMetaData[i]) {
          this.height = onMetaData[i].height;
        }
      }

      this.emit('mediaInfo', mediaInfo);
    }
  }, {
    key: "_onFrameHandler",
    value: function _onFrameHandler(_ref2) {
      var width = _ref2.width,
          height = _ref2.height,
          data = _ref2.data;

      if (this.drawer) {
        this.drawer.drawNextOutputPicture(width, height, data);
      }
    }
  }, {
    key: "_onBufferingHandler",
    value: function _onBufferingHandler() {
      var _this3 = this;

      if (this.loader) {
        this.state = 'buffering';
        this.emit('buffering');
        this.loader.read().then(function (data) {
          if (data.length) {
            _this3.processor.process(data);
          }
        });
      }
    }
  }, {
    key: "_onPreloadHandler",
    value: function _onPreloadHandler() {
      var _this4 = this;

      if (this.loader) {
        this.loader.read().then(function (data) {
          if (data.length) {
            _this4.processor.process(data);
          }
        });
      }
    }
  }, {
    key: "_onPlayingHandler",
    value: function _onPlayingHandler() {
      if (this.state != 'playing') {
        this.state = 'playing';
        this.emit('playing');
      }
    }
  }, {
    key: "_onEndHandler",
    value: function _onEndHandler() {
      this.isEnd = true;
    }
  }], [{
    key: "init",
    value: function init(_ref3) {
      var asmUrl = _ref3.asmUrl,
          wasmUrl = _ref3.wasmUrl;
      WXInlinePlayer.initPromise = new Promise(function (resolve, reject) {
        var url = window['WebAssembly'] ? wasmUrl : asmUrl;
        var head = document.head || document.getElementsByTagName('head')[0];
        var script = document.createElement('script');

        script.onload = function () {
          WXInlinePlayer.isInited = true;
          resolve();
        };

        script.onerror = function (e) {
          return reject(e);
        };

        script.src = "".concat(url);
        script.type = 'text/javascript';
        head.appendChild(script);
      });
    }
  }, {
    key: "isSupport",
    value: function isSupport() {
      return !!( // UC and Quark browser (iOS/Android) support wasm/asm limited,
      // its iOS version make wasm/asm performance very slow （maybe hook something）
      // its Android version removed support for wasm/asm, it just run pure javascript codes,
      // so it is very easy to cause memory leaks
      !/UCBrowser|Quark/.test(window.navigator.userAgent) && window.fetch && window.ReadableStream && window.Promise && window.URL && window.URL.createObjectURL && window.Blob && window.Worker && !!new Audio().canPlayType('audio/aac;').replace(/^no$/, '') && (window.AudioContext || window.webkitAudioContext) && _drawer.default.isSupport());
    }
  }, {
    key: "ready",
    value: function ready() {
      if (!WXInlinePlayer.isSupport()) {
        return Promise.resolve(false);
      }

      if (WXInlinePlayer.isInited) {
        return Promise.resolve(true);
      }

      return WXInlinePlayer.initPromise;
    }
  }]);

  return WXInlinePlayer;
}(_eventemitter.default);

_defineProperty(WXInlinePlayer, "initPromise", null);

_defineProperty(WXInlinePlayer, "isInited", false);

window.WXInlinePlayer = WXInlinePlayer;
var _default = WXInlinePlayer;
exports.default = _default;
},{"eventemitter3":"../node_modules/eventemitter3/index.js","./processor/processor":"processor/processor.js","./loader/loader":"loader/loader.js","./drawer/drawer":"drawer/drawer.js","./util/util":"util/util.js"}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "57920" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)