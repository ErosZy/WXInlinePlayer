# Javascript WebAssembly implementation

This implementation was compiled with emscripten.

Here's an example of how to use it:
```
var decoder = new TinyH264Decoder();

// Render output to the canvas when a new picture is ready
decoder.onPictureReady = function(data, width, height) {
    // TODO your implementation here. Data is a uint8 buffere in yuv420.
}

// Queue h264 NAL input data
decoder.decode(myUint8Array);
```

This code will decode H.264 annex B encoded bytes stored in a Uint8Array. Each call to `decode()` will decode a single 
NAL unit, so you need to keep calling it with new NAL until all of the input data is consumed. Note that each call to `decode()` is 
synchronous and blocking, so you may want to delay subsequent calls or wrap the whole things in a web worker to keep 
your app responsive.
The decoder will call the callbacks onPictureReady to simplify your code.

## Using the web worker

The project also contains code for a web worker implementation. Here's an example of how it's used:
```
'use strict'

export default class BrowserH264Decoder {
  static create () {
    return new Promise((resolve) => {
      const h264BsdWorker = new window.Worker('TinyH264Worker.js')
      const browserH264Decoder = new BrowserH264Decoder(h264BsdWorker)
      h264BsdWorker.addEventListener('message', (e) => {
        const message = e.data
        switch (message.type) {
          case 'pictureReady':
            browserH264Decoder._onPictureReady(message)
            break
          case 'decoderReady':
            resolve(browserH264Decoder)
            break
        }
      })
    })
  }

  constructor (h264BsdWorker) {
    this._h264BsdWorker = h264BsdWorker
  }

  /**
   * @param {Uint8Array} h264Nal
   */
  decode (h264Nal) {
    this._h264BsdWorker.postMessage({type: 'decode', data: h264Nal.buffer}, [h264Nal.buffer])
  }

  _onPictureReady (message) {
    const width = message.width
    const height = message.height
    const buffer = message.data
    this.onPicture(new Uint8Array(buffer), width, height)
  }

  /**
   * @param {Uint8Array}buffer
   * @param {number}width
   * @param {number}height
   */
  onPicture (buffer, width, height) {
    // TODO: your display logic here
  }

  terminate () {
    this._h264BsdWorker.terminate()
  }
}
```
