import Promise from 'promise-polyfill';
import { Buffer } from 'buffer';

class StreamLoader {
  constructor({ url, chunkSize = 256 * 1024 }) {
    this.url = url;
    this.done = false;
    this.reader = null;
    this.chunkSize = chunkSize;
    this.data = new Buffer(0);
    this.abortController = null;
    try {
      this.abortController = new AbortController();
    } catch (e) {
      // not support, ignore it.
    }
  }

  hasData() {
    return !this.done || (this.done && this.data.length);
  }

  read() {
    if (this.data.length < this.chunkSize) {
      if (this.done) {
        return this._getChunk();
      }
      return this._request().then(() => {
        return this._getChunk();
      });
    }
    return this._getChunk();
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.data = null;
    this.reader = null;
    this.done = true;
    this.abortController = null;
  }

  _getChunk() {
    return new Promise(resolve => {
      const buffer = this.data.slice(0, this.chunkSize);
      this.data = this.data.slice(this.chunkSize);
      resolve(buffer);
    });
  }

  _request() {
    if (this.reader) {
      return this.reader.read().then(result => {
        let { value, done } = result;
        value = Buffer.from(value ? value : new Uint8Array(0));
        this.data = Buffer.concat([this.data, value]);
        if (done) {
          this.done = true;
        } else if (this.data.length < this.chunkSize) {
          return this._request();
        }
      });
    } else {
      return fetch(this.url, {
        method: 'GET',
        signal: this.abortController.signal
      }).then(resp => {
        this.reader = resp.body.getReader();
        return this._request();
      });
    }
  }
}

export default StreamLoader;
