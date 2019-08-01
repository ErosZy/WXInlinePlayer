/*
 * Ticker
 * Visit http://createjs.com/ for documentation, updates and examples.
 *
 * Copyright (c) 2010 gskinner.com, inc.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

import EventEmitter from "eventemitter3";

function Ticker() {
  throw "Ticker cannot be instantiated.";
}

Ticker._events = new EventEmitter();
Ticker.RAF_SYNCHED = "synched";
Ticker.RAF = "raf";
Ticker.TIMEOUT = "timeout";
Ticker.timingMode = null;
Ticker.maxDelta = 0;
Ticker.paused = false;

Ticker.removeEventListener = Ticker._events.off.bind(Ticker._events);
Ticker.removeAllEventListeners = Ticker._events.off.bind(Ticker._events);
Ticker.dispatchEvent = Ticker._events.emit.bind(Ticker._events);
Ticker.hasEventListener = event => Ticker._events.listenerCount(event) > 0;
Ticker._listeners = Ticker._events.listeners.bind(Ticker._events);
Ticker._addEventListener = Ticker._events.on.bind(Ticker._events);
Ticker.addEventListener = function() {
  !Ticker._inited && Ticker.init();
  return Ticker._addEventListener.apply(Ticker, arguments);
};

Ticker._inited = false;
Ticker._startTime = 0;
Ticker._pausedTime = 0;
Ticker._ticks = 0;
Ticker._pausedTicks = 0;
Ticker._interval = 50;
Ticker._lastTime = 0;
Ticker._times = null;
Ticker._tickTimes = null;
Ticker._timerId = null;
Ticker._raf = true;

Ticker._setInterval = function(interval) {
  Ticker._interval = interval;
  if (!Ticker._inited) {
    return;
  }
  Ticker._setupTick();
};

Ticker._getInterval = function() {
  return Ticker._interval;
};

Ticker._setFPS = function(value) {
  Ticker._setInterval(1000 / value);
};

Ticker._getFPS = function() {
  return 1000 / Ticker._interval;
};

try {
  Object.defineProperties(Ticker, {
    interval: { get: Ticker._getInterval, set: Ticker._setInterval },
    framerate: { get: Ticker._getFPS, set: Ticker._setFPS }
  });
} catch (e) {
  console.log(e);
}

Ticker.init = function() {
  if (Ticker._inited) {
    return;
  }
  Ticker._inited = true;
  Ticker._times = [];
  Ticker._tickTimes = [];
  Ticker._startTime = Ticker._getTime();
  Ticker._times.push((Ticker._lastTime = 0));
  Ticker.interval = Ticker._interval;
};

Ticker.reset = function() {
  if (Ticker._raf) {
    var f = window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.oCancelAnimationFrame ||
      window.msCancelAnimationFrame;
    f && f(Ticker._timerId);
  } else {
    clearTimeout(Ticker._timerId);
  }
  Ticker.removeAllEventListeners("tick");
  Ticker._timerId = Ticker._times = Ticker._tickTimes = null;
  Ticker._startTime = Ticker._lastTime = Ticker._ticks = Ticker._pausedTime = 0;
  Ticker._inited = false;
};

Ticker.getMeasuredTickTime = function(ticks) {
  var ttl = 0,
    times = Ticker._tickTimes;
  if (!times || times.length < 1) {
    return -1;
  }

  // by default, calculate average for the past ~1 second:
  ticks = Math.min(times.length, ticks || Ticker._getFPS() | 0);
  for (var i = 0; i < ticks; i++) {
    ttl += times[i];
  }
  return ttl / ticks;
};

Ticker.getMeasuredFPS = function(ticks) {
  var times = Ticker._times;
  if (!times || times.length < 2) {
    return -1;
  }

  // by default, calculate fps for the past ~1 second:
  ticks = Math.min(times.length - 1, ticks || Ticker._getFPS() | 0);
  return 1000 / ((times[0] - times[ticks]) / ticks);
};

Ticker.getTime = function(runTime) {
  return Ticker._startTime
    ? Ticker._getTime() - (runTime ? Ticker._pausedTime : 0)
    : -1;
};

Ticker.getEventTime = function(runTime) {
  return Ticker._startTime
    ? (Ticker._lastTime || Ticker._startTime) -
        (runTime ? Ticker._pausedTime : 0)
    : -1;
};

Ticker.getTicks = function(pauseable) {
  return Ticker._ticks - (pauseable ? Ticker._pausedTicks : 0);
};

Ticker._handleSynch = function() {
  Ticker._timerId = null;
  Ticker._setupTick();

  // run if enough time has elapsed, with a little bit of flexibility to be early:
  if (Ticker._getTime() - Ticker._lastTime >= (Ticker._interval - 1) * 0.97) {
    Ticker._tick();
  }
};

Ticker._handleRAF = function() {
  Ticker._timerId = null;
  Ticker._setupTick();
  Ticker._tick();
};

Ticker._handleTimeout = function() {
  Ticker._timerId = null;
  Ticker._setupTick();
  Ticker._tick();
};

Ticker._setupTick = function() {
  if (Ticker._timerId != null) {
    return;
  } // avoid duplicates

  var mode = Ticker.timingMode;
  if (mode == Ticker.RAF_SYNCHED || mode == Ticker.RAF) {
    var f = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame;
    if (f) {
      Ticker._timerId = f(
        mode == Ticker.RAF ? Ticker._handleRAF : Ticker._handleSynch
      );
      Ticker._raf = true;
      return;
    }
  }
  Ticker._raf = false;
  Ticker._timerId = setTimeout(Ticker._handleTimeout, Ticker._interval);
};

Ticker._tick = function() {
  var paused = Ticker.paused;
  var time = Ticker._getTime();
  var elapsedTime = time - Ticker._lastTime;
  Ticker._lastTime = time;
  Ticker._ticks++;

  if (paused) {
    Ticker._pausedTicks++;
    Ticker._pausedTime += elapsedTime;
  }

  if (Ticker.hasEventListener("tick")) {
    var event = {};
    var maxDelta = Ticker.maxDelta;
    event.delta = maxDelta && elapsedTime > maxDelta ? maxDelta : elapsedTime;
    event.paused = paused;
    event.time = time;
    event.runTime = time - Ticker._pausedTime;
    Ticker.dispatchEvent('tick', event);
  }

  Ticker._tickTimes.unshift(Ticker._getTime() - time);
  while (Ticker._tickTimes.length > 100) {
    Ticker._tickTimes.pop();
  }

  Ticker._times.unshift(time);
  while (Ticker._times.length > 100) {
    Ticker._times.pop();
  }
};

const w = window;
w.performance = w.performance || {};

const now = w.performance.now ||
  w.performance.mozNow ||
  w.performance.msNow ||
  w.performance.oNow ||
  w.performance.webkitNow;

Ticker._getTime = function() {
  return (
    ((now && now.call(w.performance)) || new Date().getTime()) - Ticker._startTime
  );
};

export default Ticker;
