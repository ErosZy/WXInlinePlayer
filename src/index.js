import EventEmitter from 'eventemitter3';
import Promise from 'promise-polyfill';
import Processor from './processor/processor';
import Loader from './loader/loader';
import Drawer from './drawer/drawer';

class WXInlinePlayer extends EventEmitter {
  static initPromise = null;
  static isInited = false;

  constructor({
    url = '',
    $container,
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

    if (this.autoplay) {
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
        break;
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
