import Promise from 'promise-polyfill';
import { Buffer } from 'buffer';

const MAX_REQ_RETRY = 3;
class ChunkLoader {
  constructor({ url, chunkSize = 256 * 1024 }) {
    this.url = url;
    this.chunkSize = chunkSize;
    this.startIndex = 0;
    this.fileSize = 0;
    this.downloadSize = 0;
    this.done = false;
    this.xhr = null;
  }

  hasData() {
    return !this.done;
  }

  read() {
    if (!this.fileSize) {
      return this._getFileSize().then(() => {
        return this._request();
      });
    }

    if (!this.done) {
      return this._request();
    }

    return Promise.resolve(new Buffer(0));
  }

  cancel() {
    if (this.xhr) {
      this.xhr.cancel();
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
            if (this.downloadSize >= this.fileSize) {
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
      let endIndex = this.startIndex + this.chunkSize;
      if (this.fileSize && this.fileSize - this.downloadSize < this.chunkSize) {
        endIndex = this.fileSize;
      }

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

  _getFileSize() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', this.url);
      xhr.error = reject;
      xhr.onload = () => {
        if (xhr.readyState == 4) {
          if (xhr.status >= 200 && xhr.status <= 299) {
            this.fileSize = xhr.getResponseHeader('Content-Length');
            this.fileSize = parseInt(this.fileSize);
            resolve();
          } else {
            reject(new Error(`get file size error: ${xhr.status}`));
          }
        }
      };
      xhr.send();
    });
  }
}

export default ChunkLoader;
