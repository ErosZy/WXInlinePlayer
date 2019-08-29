import Promise from 'promise-polyfill';
import { Buffer } from 'buffer';

const MAX_REQ_RETRY = 3;
class ChunkLoader {
  constructor({ url, chunkSize = 256 * 1024, cacheInMemory = false }) {
    this.url = url;
    this.cacheInMemory = cacheInMemory;
    this.chunkSize = chunkSize;
    this.startIndex = 0;
    this.downloadSize = 0;
    this.done = false;
    this.xhr = null;
  }

  hasData() {
    return !this.done;
  }

  read() {
    if (!this.done) {
      return this._request();
    }

    return Promise.resolve(new Buffer(0));
  }

  cancel() {
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
    this.done = true;
  }

  _request() {
    let isSuccess = false;
    let promise = this._fetch();
    for (let i = 0; i < MAX_REQ_RETRY; i++) {
      promise = promise
        .then(buffer => {
          if (!isSuccess) {
            isSuccess = true;
            this.downloadSize += buffer.length;
            if (buffer.length < this.chunkSize) {
              this.done = true;
            }
          }
          return buffer;
        })
        .catch(e => {
          if (i >= MAX_REQ_RETRY - 1) {
            throw e;
          } else {
            return this._fetch();
          }
        });
    }
    return promise;
  }

  _fetch() {
    return new Promise((resolve, reject) => {
      const endIndex = this.startIndex + this.chunkSize;
      this.xhr = new XMLHttpRequest();
      this.xhr.open('GET', this.url);
      this.xhr.responseType = 'arraybuffer';
      this.xhr.setRequestHeader(
        'Range',
        `bytes=${this.startIndex}-${endIndex}`
      );
      this.xhr.onerror = reject;
      this.xhr.onload = () => {
        if (this.xhr.readyState == 4) {
          if (this.xhr.status >= 200 && this.xhr.status <= 299) {
            this.startIndex = endIndex + 1;
            resolve(new Uint8Array(this.xhr.response));
          } else {
            reject(new Error(`error status: ${this.xhr.status}`));
          }
        }
      };
      this.xhr.send();
    });
  }
}

export default ChunkLoader;
