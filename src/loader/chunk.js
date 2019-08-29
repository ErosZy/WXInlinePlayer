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

import Promise from 'promise-polyfill';
import { Buffer } from 'buffer';

const MAX_REQ_RETRY = 3;
class ChunkLoader {
  constructor({ url, chunkSize = 256 * 1024/*, cacheInMemory = false*/ }) {
    this.url = url;
  /*this.cacheInMemory = cacheInMemory;*/
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
