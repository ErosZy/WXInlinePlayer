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

import EventEmitter from 'eventemitter3';
import Promise from 'promise-polyfill';
import Processor from './processor/processor';
import Loader from './loader/loader';
import Drawer from './drawer/drawer';
import Util from './util/util';

class WXInlinePlayer extends EventEmitter {
  static initPromise = null;
  static isInited = false;

  constructor({
    url = '',
    $container,
    hasVideo = true,
    hasAudio = true,
    volume = 1.0,
    muted = false,
    autoplay = false,
    loop = false,
    isLive = false,
    chunkSize = 256 * 1024,
    preloadTime = 1e3,
    bufferingTime = 3e3,
    cacheSegmentCount = 128,
    /*cacheInMemory = false,*/
    customLoader = null
  }) {
    super();
    this.url = url;
    this.$container = $container;
    this.width = $container.width;
    this.height = $container.height;
    this.vol = volume;
    this.muted = muted;
    this.duration = 0;
    this.autoplay = autoplay;
    this.loop = loop;
    this.isLive = isLive;
    this.chunkSize = chunkSize;
    this.preloadTime = preloadTime;
    this.bufferingTime = bufferingTime;
    this.cacheSegmentCount = cacheSegmentCount;
    /*this.cacheInMemory = cacheInMemory;*/
    this.customLoader = customLoader;
    this.timeUpdateTimer = null;
    this.isInitlize = false;
    this.isEnd = false;
    this.state = 'created';

    if (((hasVideo && !hasAudio) || Util.isWeChat()) && this.autoplay) {
      this._initlize();
      this.processor.unblock(0);
    }
  }

  static init({ asmUrl, wasmUrl }) {
    WXInlinePlayer.initPromise = new Promise((resolve, reject) => {
      const url = window['WebAssembly'] ? wasmUrl : asmUrl;
      const head = document.head || document.getElementsByTagName('head')[0];
      const script = document.createElement('script');
      script.onload = () => {
        WXInlinePlayer.isInited = true;
        resolve();
      };
      script.onerror = e => reject(e);
      script.src = `${url}`;
      script.type = 'text/javascript';
      head.appendChild(script);
    });
  }

  static isSupport() {
    return !!(
      window.URL &&
      window.URL.createObjectURL &&
      window.Blob &&
      window.Worker &&
      !!new Audio().canPlayType('audio/aac;').replace(/^no$/, '') &&
      (window.AudioContext || window.webkitAudioContext) &&
      Drawer.isSupport()
    );
  }

  static ready() {
    if (!WXInlinePlayer.isSupport()) {
      return Promise.resolve(false);
    }

    if (WXInlinePlayer.isInited) {
      return Promise.resolve(true);
    }

    return WXInlinePlayer.initPromise;
  }

  play() {
    if (this.state != 'destroy' && !this.isInitlize) {
      this._initlize();
      this.processor.unblock(0);
    }
  }

  stop() {
    this.state = 'stopped';
    this.isInitlize = false;
    clearInterval(this.timeUpdateTimer);

    if (this.processor) {
      this.processor.destroy();
      this.processor = null;
    }

    if (this.loader) {
      this.loader.cancel();
    }

    this.emit('stopped');
  }

  pause() {
    if (this.isLive) {
      this.stop();
    } else {
      if (this.processor) {
        this.state = 'paused';
        this.processor.pause();
      }
    }
  }

  resume() {
    if (this.isLive) {
      this.play();
    } else {
      if (this.processor) {
        this.processor.resume();
      }
    }
  }

  volume(volume) {
    if (this.processor) {
      return this.processor.volume(volume);
    }
  }

  mute(muted) {
    if (this.processor) {
      return this.processor.mute(muted);
    }
  }

  destroy() {
    this.state = 'destroy';
    this.removeAllListeners();
    this.stop();

    if (this.drawer) {
      this.drawer.destroy();
      this.drawer = null;
    }
  }

  getCurrentTime() {
    if (this.processor) {
      return this.processor.getCurrentTime();
    } else {
      return 0.0;
    }
  }

  getAvaiableDuration() {
    if (this.processor) {
      return this.processor.getAvaiableDuration();
    }
    return 0;
  }

  _initlize() {
    clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = setInterval(() => {
      let currentTime = 0.0;
      if (this.processor) {
        currentTime = this.processor.getCurrentTime();
      }

      this.emit('timeUpdate', currentTime < 0 ? 0.0 : currentTime);
      if (this.isEnd) {
        if (
          (this.processor.hasAudio && currentTime >= this.duration) ||
          (this.processor.hasVideo && !this.processor.frames.length)
        ) {
          this.emit('end');
          this.stop();
          if (this.loop) {
            this.play();
          }
        }
      }
    }, 250);

    this.isEnd = false;
    this.drawer = new Drawer(this.$container);
    this.loader = new (this.customLoader ? this.customLoader : Loader)({
      type: this.isLive ? 'stream' : 'chunk',
      opt: {
        url: this.url,
        chunkSize: this.chunkSize
        /*cacheInMemory: this.cacheInMemory*/
      }
    });

    this.processor = new Processor({
      volume: this.vol,
      muted: this.muted,
      preloadTime: this.preloadTime,
      bufferingTime: this.bufferingTime,
      cacheSegmentCount: this.cacheSegmentCount
    });

    this.processor.on('mediaInfo', this._onMediaInfoHandler.bind(this));
    this.processor.on('frame', this._onFrameHandler.bind(this));
    this.processor.on('buffering', this._onBufferingHandler.bind(this));
    this.processor.on('preload', this._onPreloadHandler.bind(this));
    this.processor.on('playing', this._onPlayingHandler.bind(this));
    this.processor.on('end', this._onEndHandler.bind(this));

    this.isInitlize = true;
  }

  _onMediaInfoHandler(mediaInfo) {
    const { onMetaData } = mediaInfo;
    for (let i = 0; i < onMetaData.length; i++) {
      if ('duration' in onMetaData[i]) {
        this.duration = onMetaData[i].duration * 1000;
      } else if ('width' in onMetaData[i]) {
        this.width = onMetaData[i].width;
      } else if ('height' in onMetaData[i]) {
        this.height = onMetaData[i].height;
      }
    }
    this.emit('mediaInfo', mediaInfo);
  }

  _onFrameHandler({ width, height, stride0, stride1, data }) {
    if (this.drawer) {
      this.drawer.drawNextOutputPicture(width, height, stride0, stride1, data);
    }
  }

  _onBufferingHandler() {
    if (this.loader) {
      this.state = 'buffering';
      this.emit('buffering');
      this.loader.read().then(data => {
        if (data.length) {
          this.processor.process(data);
        }
      });
    }
  }

  _onPreloadHandler() {
    if (this.loader) {
      this.loader.read().then(data => {
        if (data.length) {
          this.processor.process(data);
        }
      });
    }
  }

  _onPlayingHandler() {
    if (this.state != 'playing') {
      this.state = 'playing';
      this.emit('playing');
    }
  }

  _onEndHandler() {
    this.isEnd = true;
  }
}

window.WXInlinePlayer = WXInlinePlayer;

export default WXInlinePlayer;
