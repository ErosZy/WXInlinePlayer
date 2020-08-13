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
import Processor from './processor/processor';
import Loader from './loader/loader';
import Drawer from './drawer/drawer';
import Util from './util/util';

const STATE = {
  created:"created",
  playing:"playing",
  buffering:"buffering",
  paused:"paused",
  stopped:"stopped",
  destroyed:"destroyed"
};

class WXInlinePlayer extends EventEmitter {
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
    /**
     * created
     * playing
     * buffering
     * paused
     * stopped
     * destroy
     */
    this.state = STATE.created;

    if (((hasVideo && !hasAudio) || Util.isWeChat()) && this.autoplay) {
      this._initlize();
      this.processor.unblock(0);
    }
  }

  static isSupport() {
    return !!
    (
      // UC and Quark browser (iOS/Android) support wasm/asm limited,
      // its iOS version make wasm/asm performance very slow （maybe hook something）
      // its Android version removed support for wasm/asm, it just run pure javascript codes,
      // so it is very easy to cause memory leaks
      !/UCBrowser|Quark/.test(window.navigator.userAgent) &&
      window.fetch &&
      window.ReadableStream &&
      window.Promise &&
      window.URL &&
      window.URL.createObjectURL &&
      window.Blob &&
      window.Worker &&
      !!new Audio().canPlayType('audio/aac;').replace(/^no$/, '') &&
      (window.AudioContext || window.webkitAudioContext) &&
      Drawer.isSupport()
    );
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

  static ready() {
    if (!WXInlinePlayer.isSupport()) {
      return Promise.resolve(false);
    }

    if (WXInlinePlayer.isInited) {
      return Promise.resolve(true);
    }

    return WXInlinePlayer.initPromise;
  }

  /**
   * 首次播放。不包括暂停之后的恢复播放。
   */
  play() {
    if (this.state != STATE.destroyed && !this.isInitlize) {
      this._initlize();
      this.processor.unblock(0);
    }
    this.emit('play');
  }

  stop() {
    this.state = STATE.stopped;
    this.isInitlize = false;
    clearInterval(this.timeUpdateTimer);

    if (this.processor) {
      this.processor.destroy();
      this.processor = null;
    }

    if (this.loader) {
      this.loader.removeAllListeners();
      this.loader.cancel();
    }

    this.emit('stopped');
  }

  /**
   * 每个API应该职责单一，莫要设计UI交互逻辑，让用户去做组合使用API，形成复杂的交互。
   * 因此，暂停就只是做暂停的事情。
   */
  pause() {
    if (this.isLive) {
      throw new Error("Live stream can't be paused,please call stop() instead.")
    } else {
      if (this.processor) {
        this.state = STATE.paused;
        this.processor.pause();
        this.emit('paused');
      }
    }    
  }

  /**
   * 同上，应该职责单一
   */
  resume() {
    if (this.isLive) {
      throw new Error("Because live stream can't be paused, so can't be resumed,please call play() instead.")
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
    this.removeAllListeners();
    this.stop();
    if (this.drawer) {
      this.drawer.destroy();
      this.drawer = null;
    }
    this.state = STATE.destroyed;
  }

  getCurrentTime() {
    if (this.processor) {
      return this.processor.getCurrentTime();
    } else {
      return 0.0;
    }
  }

  /**
   * 获得可播放的时长
   */
  getAvaiableDuration() {
    if (this.processor) {
      return this.processor.getAvaiableDuration();
    }
    return 0;
  }

  /**
   * 获得流媒体总时长
   *
   * @return {number}
   *          The total duration of the current media.
   */
  getDuration() {
    return this.duration;
  }

  _initlize() {
    clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = setInterval(() => {
      let currentTime = 0.0;
      if (!this.isEnd){
        if (this.processor) {
          currentTime = this.processor.getCurrentTime();
        }
        this.emit('timeUpdate', currentTime < 0 ? 0.0 : currentTime);
      }else {
        this.emit('timeUpdate', this.duration);//让进度可以100%
        if (
          (this.processor.hasAudio && currentTime >= this.duration) ||
          (this.processor.hasVideo && !this.processor.frames.length)
        ) {
          if (this.loop) {
            this.stop()
            this.play();
          }
        }
      }
    }, 250);

    this.isEnd = false;
    this.drawer =  new Drawer(this.$container);
    this.loader = new (this.customLoader ? this.customLoader : Loader)({
      type: this.isLive ? 'stream' : 'chunk',
      opt: {
        url: this.url,
        chunkSize: this.chunkSize
        /*cacheInMemory: this.cacheInMemory*/
      }
    });

    this.loader.on('loadError', error => this.emit('loadError', error));
    this.loader.on('loadSuccess', () => this.emit('loadSuccess'));

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
    this.processor.on('performance', data => this.emit('performance', data));

    this.isInitlize = true;
  }

  _onMediaInfoHandler(mediaInfo) {
    const { onMetaData = [] } = mediaInfo;
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

  _onFrameHandler({ width, height, data }) {
    if (this.drawer) {
      this.drawer.drawNextOutputPicture(width, height, data);
    }
  }

  _onBufferingHandler() {
    if (this.loader) {
      this.state = STATE.buffering;
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
    if (this.state != STATE.playing) {
      this.state = STATE.playing;
      this.emit('playing');
    }
  }

  _onEndHandler() {
    this.isEnd = true;
    this.emit('end');
  }
}

window.WXInlinePlayer = WXInlinePlayer;

export default WXInlinePlayer;