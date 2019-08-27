import raf from 'raf';
const SMOOTH_INTERVAL = 1000 / 60;
class Ticker {
  constructor() {
    this.timestamp = 0;
    this.callbacks = [];
    this.handler = raf(this._tick.bind(this));
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
      loop = Math.floor((now - this.timestamp) / SMOOTH_INTERVAL);
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
    // if (window.performance && window.performance.now) {
    //   return window.performance.now();
    // }
    return +new Date();
  }
}

window.Ticker = Ticker;
export default Ticker;
