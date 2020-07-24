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
export default function() {
  let supportSharedBuffer = false;
  try {
    supportSharedBuffer = !!new SharedArrayBuffer(0);
  } catch (e) {
    // nothing to do...
  }

  function concat(i, j) {
    const buffer = new Uint8Array(i.length + j.length);
    buffer.set(new Uint8Array(i), 0);
    buffer.set(new Uint8Array(j), i.length);
    return buffer;
  }

  function slice(buffer, startIndex, endIndex) {
    if (!endIndex || endIndex - startIndex > buffer.length) {
      endIndex = buffer.length;
    }

    if(supportSharedBuffer){
      let sharedBuffer = new SharedArrayBuffer(endIndex - startIndex);
      let result = new Uint8Array(sharedBuffer);
      result.set(buffer.subarray(startIndex, endIndex));
      return result;
    }else{
      return buffer.subarray(startIndex, endIndex);
    }
  }

  function StreamLoader({ url, chunkSize = 256 * 1024 }) {
    this.url = url;
    this.done = false;
    this.reader = null;
    this.chunkSize = chunkSize;
    this.data = new Uint8Array(0);
  }

  StreamLoader.prototype.hasData = function() {
    return !this.done || (this.done && this.data.length);
  };

  StreamLoader.prototype.read = function() {
    if (this.data.length < this.chunkSize) {
      if (this.done) {
        return this._getChunk();
      }
      return this._request().then(() => {
        return this._getChunk();
      });
    }
    return this._getChunk();
  };

  StreamLoader.prototype.cancel = function() {
    this.data = null;
    this.reader = null;
    this.done = true;
  };

  StreamLoader.prototype._getChunk = function() {
    return new Promise(resolve => {
      const buffer = slice(this.data, 0, this.chunkSize);
      this.data = slice(
        this.data, 
        this.data.length <= this.chunkSize ? this.data.length : this.chunkSize
      );
      resolve(buffer);
    });
  };

  StreamLoader.prototype._request = function() {
    if (this.reader) {
      return this.reader.read().then(result => {
        let { value, done } = result;
        value = new Uint8Array(value ? value : 0);
        this.data = concat(this.data, value);
        if (done) {
          this.done = true;
        } else if (this.data.length < this.chunkSize) {
          return this._request();
        }
      });
    } else {
      return fetch(this.url, {
        method: 'GET'
      })
        .then(resp => {
          const { status, statusText } = resp;
          if (status < 200 || status > 299) {
            return resp.text().then(text => {
              self.postMessage({
                type: 'event',
                data: {
                  type: 'loadError',
                  data: { status, statusText, detail: text }
                }
              });
            });
          }

          self.postMessage({ type: 'event', data: { type: 'loadSuccess' } });
          this.reader = resp.body.getReader();
          return this._request();
        })
        .catch(e => {
          self.postMessage({
            type: 'event',
            data: {
              type: 'loadError',
              data: { status: -1, statusText: 'unknown error', detail: e }
            }
          });
        });
    }
  };

  let loader = null;
  self.onmessage = message => {
    const { type, id, data } = message.data;
    if (type == 'constructor') {
      loader = new StreamLoader(data);
      self.postMessage({ id });
    } else if (type == 'hasData') {
      self.postMessage({
        id,
        data: !loader ? false : loader.hasData()
      });
    } else if (type == 'read') {
      if (loader) {
        loader.read().then(data => {
          data = new Uint8Array(data);
          self.postMessage({ id, data }, [data.buffer]);
        });
      } else {
        self.postMessage({ id, data: new Uint8Array(0) });
      }
    } else if (type == 'cancel') {
      if (loader) {
        loader.cancel();
      }
      self.postMessage({ id, destroy: true });
    }
  };
}
