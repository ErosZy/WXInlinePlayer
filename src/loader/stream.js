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
        signal: this.abortController ? this.abortController.signal : null
      }).then(resp => {
        this.reader = resp.body.getReader();
        return this._request();
      });
    }
  }
}

export default StreamLoader;
