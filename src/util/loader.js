import Promise from "bluebird";

class Loader {
  constructor() {
    this.xhr = null;
  }

  load({ url, data, headers, withCredentials = false }) {
    return new Promise((resolve, reject) => {
      const xhr = (this.xhr = new XMLHttpRequest());
      if (typeof data === "object") {
        const querystring = [];
        for (let key in data) {
          querystring.push(`${key}=${data[key]}`);
        }
        url += (url.lastIndexOf("?") > -1 ? "&" : "?") + querystring.join("&");
      }

      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onreadystatechange = e => {
        this._onReadyStateChangeHandler(e, resolve, reject);
      };

      xhr.onload = e => {
        this._onLoadHandler(e, resolve, reject);
      };

      xhr.onerror = e => {
        this._onError(e, resolve, reject);
      };

      if (withCredentials && xhr["withCredentials"]) {
        xhr.withCredentials = true;
      }

      if (typeof headers === "object") {
        for (let key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }
      }

      xhr.send();
    });
  }

  abort() {
    if (this.xhr == null) {
      return false;
    }

    this.xhr.onreadystatechange = null;
    this.xhr.onload = null;
    this.xhr.onerror = null;
    this.xhr.abort();
    this.xhr = null;
  }

  _onReadyStateChangeHandler(ev, resolve, reject) {
    const xhr = ev.target;
    if (xhr.readyState === 2) {
      if (!(xhr.status >= 200 && xhr.status <= 299)) {
        const { status, statusText } = xhr;
        const error = new Error(`Http code invalid, ${status} ${statusText}`);
        reject(error);
      }
    }
  }

  _onLoadHandler(ev, resolve) {
    resolve(ev.target.response);
  }

  _onError(ev, resolve, reject) {
    reject(ev);
  }
}

export default Loader;
