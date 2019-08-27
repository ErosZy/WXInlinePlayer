import raf from 'raf';
class Ticker {
  constructor() {
    this.interval = 1000 / 60;
    this.timestamp = 0;
    this.callbacks = [];
    this.handler = raf(this._tick.bind(this));
  }

  setFps(fps) {
    this.interval = 1000 / fps;
  }

  add(func) {
    this.callbacks.push(func);
  }

  remove(func) {
    for (let i = this.callbacks.length - 1; i >= 0; i--) {
      if (this.callbacks[i] == func) {
        this.callbacks.splice(i, 1);
      }
    }
  }

  destroy() {
    raf.cancel(this.handler);
    this.handler = null;
    this.callbacks = [];
  }

  _tick() {
    let loop = 1;
    const now = this._now();
    if (!this.timestamp) {
      this.timestamp = now;
      loop = Math.floor((now - this.timestamp) / this.interval);
    }

    for (let i = 0; i < this.callbacks.length; i++) {
      for (let j = 0; j < loop; j++) {
        this.callbacks[i](now - this.timestamp);
      }
    }

    this.timestamp = now;
    this.handler = raf(this._tick.bind(this));
  }

  _now() {
    if (window.performance && window.performance.now) {
      return window.performance.now();
    }
    return +new Date();
  }
}

export default Ticker;
