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

import EventEmitter from "eventemitter3";
import Processor from "./processor/processor";
import Loader from "./loader/loader";
import Drawer from "./drawer/drawer";
import Util from "./util/util";

/**
 * 生命周期对应的状态
 */
const STATE = {
  created: "created",
  play: "play",
  playing: "playing",
  buffering: "buffering",
  paused: "paused",
  resumed: "resumed",
  ended: "ended",
  stopped: "stopped",
  destroyed: "destroyed",
};

const UPDATE_INTERVAL_TIME = 100; //ms

class WXInlinePlayer extends EventEmitter {
  static isInited = false;

  constructor({
    url = "",
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
    customLoader = null,
  }) {
    super();
    this.url = url;
    this.$container = $container;
    this.width = $container.width;
    this.height = $container.height;
    this.hasVideo = hasVideo;
    this.hasAudio = hasAudio;
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
    /**解码完 */
    this.isDecodeEnd = false;
    /**播放完 */
    this.isEnd = false;
    this.state = STATE.created;
    this.timestapmArr = []; //时间戳数组

    if (
      //(/*(hasVideo && !hasAudio) ||  //这个条件表达式很奇怪，不符合一般API封装的逻辑，或者说WXInlinePlayer作为抽象的API，不用在当前layer考虑特殊具体业务场景的组合情况，所以注释掉 */
      //Util.isWeChat() /* 微信自动播放？也建议后续去掉这个具体的业务逻辑 */) ||
      this.autoplay /*autoplay如果是true就应该自动播放*/
    ) {
      this.play();
    }
  }

  static isSupport() {
    return !!(
      // UC and Quark browser (iOS/Android) support wasm/asm limited,
      // its iOS version make wasm/asm performance very slow （maybe hook something）
      // its Android version removed support for wasm/asm, it just run pure javascript codes,
      // so it is very easy to cause memory leaks
      (
        !/UCBrowser|Quark/.test(window.navigator.userAgent) &&
        window.fetch &&
        window.ReadableStream &&
        window.Promise &&
        window.URL &&
        window.URL.createObjectURL &&
        window.Blob &&
        window.Worker &&
        !!new Audio().canPlayType("audio/aac;").replace(/^no$/, "") &&
        (window.AudioContext || window.webkitAudioContext) &&
        Drawer.isSupport()
      )
    );
  }

  /**
   * init WXInlinePlayer and return a promise.
   */
  static ready(options) {
    if (!WXInlinePlayer.isSupport()) {
      return Promise.reject(new Error("your browser do not support WXInlinePlayer."));
    }

    return new Promise((resolve, reject) => {
      const url = window["WebAssembly"] ? options.wasmUrl : options.asmUrl;
      const head = document.head || document.getElementsByTagName("head")[0];
      const script = document.createElement("script");
      script.onload = () => {
        resolve(new WXInlinePlayer(options));
        WXInlinePlayer.isInited = true;
      };
      script.onerror = (e) => reject(e);
      script.src = `${url}`;
      script.type = "text/javascript";
      head.appendChild(script);
    });
  }

  /**
   * 首次播放。不包括暂停之后的恢复播放。
   */
  play() {
    if (this.state != STATE.destroyed && !this.isInitlize) {
      this._init4play();
      this.processor.unblock(0);
    }
    this.emit("play");
  }

  clearCanvas() {
    let c = this.$container;
    let gl = c.getContext("webgl");
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  }

  /**
   * 每个API应该职责单一，莫要设计UI交互逻辑，让用户去做组合使用API，形成复杂的交互。
   * 因此，暂停就只是做暂停的事情。
   */
  pause() {
    if (this.isLive) {
      throw new Error("Live stream can't be paused,please call stop() instead.");
    } else {
      if (this.processor) {
        this.state = STATE.paused;
        this.processor.pause();
        this.emit("paused");
      }
    }
  }

  /**
   * 同上，应该职责单一
   */
  resume() {
    if (this.isLive) {
      throw new Error("Because live stream can't be paused, so can't be resumed,please call play() instead.");
    } else {
      if (this.processor) {
        this.processor.resume();
        this.emit("resumed");
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

  stop() {
    this.state = STATE.stopped;
    this.isInitlize = false;
    this.timestapmArr.length = 0;
    clearInterval(this.timeUpdateTimer);

    if (this.processor) {
      this.processor.destroy();
      this.processor = null;
    }

    if (this.loader) {
      this.loader.removeAllListeners();
      this.loader.cancel();
      this.loader = null;
    }

    this.emit("stopped");
  }

  destroy() {
    this.stop();
    this.removeAllListeners();

    // release WebGL context
    if (this.drawer) {
      this.drawer.destroy();
      this.drawer = null;
    }

    this.state = STATE.destroyed;
  }

  currentTime(p) {
    if (p == undefined)
      if (this.processor) {
        return this.processor.getCurrentTime();
      } else {
        if (this.processor) {
          this.processor.setCurrentTime(p);
        }
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

  /**
   * called by play()
   */
  _init4play() {
    clearInterval(this.timeUpdateTimer);
    this.isDecodeEnd = false;
    this.isEnd = false;
    // let stTime = new Date().getTime();

    function fn() {
      /////////判断播放结束的逻辑：方案一
      const timestapmArrLength = 3;
      if (this.timestapmArr.length >= timestapmArrLength) this.timestapmArr.shift();
      this.timestapmArr.push(this.currentTime());

      this.isEnd = this.currentTime() >= this.getDuration() && this.getDuration() > 0;
      let length = this.timestapmArr.length;
      this.isEnd =
        length == timestapmArrLength && this.isDecodeEnd && this.timestapmArr[0] == this.timestapmArr[length - 1];
      if (this.isEnd) {
        if (this.state != STATE.ended) {
          //仅仅发一次通知
          this.emit("ended");
          this.state = STATE.ended;
        }
      }

      /////////判断播放结束的逻辑：方案二，不准
      // if (this.isDecodeEnd && (
      //     (this.processor.hasAudio && this.currentTime() >= this.getDuration()) ||
      //     (this.processor.hasVideo && !this.processor.frames.length)
      //   )
      // ){
      //   this.isEnd = true;
      // };
      // if (this.isEnd && this.state != STATE.ended) { //仅仅发一次通知
      //   this.emit('ended');
      //   this.state = STATE.ended;
      // }

      if (!this.isEnd) {
        // console.log("时间流逝：",new Date().getTime()-stTime,"currentTime："+ this.currentTime()+" / " + this.getDuration(),"isDecodeEnd:"+this.isDecodeEnd)
        this.emit("timeUpdate", this.currentTime() < 0 ? 0.0 : this.currentTime());
      } else {
        // console.log("时间流逝：",new Date().getTime()-stTime,"currentTime："+ this.getDuration()+" / " + this.getDuration())
        this.emit("timeUpdate", this.getDuration()); //让进度可以100%
        if (this.loop) {
          this.stop();
          this.play();
        }
        // clearInterval(this.timeUpdateTimer);
      }
    }

    fn.call(this); //首先，立即执行一次

    this.timeUpdateTimer = setInterval(fn.bind(this), UPDATE_INTERVAL_TIME); //然后，每隔 UPDATE_INTERVAL_TIME ms执行一次
    this.drawer = this.drawer ? this.drawer : new Drawer(this.$container); //重用drawer以便重用WebGL.context
    this.loader = new (this.customLoader ? this.customLoader : Loader)({
      type: this.isLive ? "stream" : "chunk",
      opt: {
        url: this.url,
        chunkSize: this.chunkSize,
        /*cacheInMemory: this.cacheInMemory*/
      },
    });

    this.loader.on("loadError", (error) => this.emit("loadError", error));
    this.loader.on("loadSuccess", () => {
      this.emit("loadSuccess");
    });

    this.processor = new Processor({
      volume: this.vol,
      muted: this.muted,
      preloadTime: this.preloadTime,
      bufferingTime: this.bufferingTime,
      cacheSegmentCount: this.cacheSegmentCount,
      hasVideo: this.hasVideo,
      hasAudio: this.hasAudio,
    });

    this.processor.on("mediaInfo", this._onMediaInfoHandler.bind(this));
    this.processor.on("frame", this._onFrameHandler.bind(this));
    this.processor.on("buffering", this._onBufferingHandler.bind(this));
    this.processor.on("preload", this._onPreloadHandler.bind(this));
    this.processor.on("playing", this._onPlayingHandler.bind(this));
    this.processor.on("decodeEnded", this._onDecodeEndHandler.bind(this));
    this.processor.on("performance", (data) => this.emit("performance", data));

    this.isInitlize = true;
  }

  _onMediaInfoHandler(mediaInfo) {
    //注意：
    //这里设置canvas(this.$container)的width和height属性，会指定绘制的真实分辨率。
    //若要让canvas拉伸填满指定的高宽，则由css的style.width和style.height决定。

    const { onMetaData = [] } = mediaInfo;
    for (let i = 0; i < onMetaData.length; i++) {
      if ("duration" in onMetaData[i]) {
        this.duration = onMetaData[i].duration * 1000;
      } else if ("width" in onMetaData[i]) {
        this.width = this.$container.width = onMetaData[i].width;
      } else if ("height" in onMetaData[i]) {
        this.height = this.$container.height = onMetaData[i].height;
      }
    }
    this.emit("mediaInfo", mediaInfo);
  }

  _onFrameHandler({ width, height, data }) {
    if (this.drawer) {
      //注意：
      //这里设置canvas(this.$container)的width和height属性，会指定绘制的真实分辨率。
      //若要让canvas拉伸填满指定的高宽，则由css的style.width和style.height决定。
      this.$container.width = width;
      this.$container.height = height;

      // console.log("this.width/height",this.width,this.height,"this.$container.width/height",this.$container.width,this.$container.height,"draw width/height",width, height);
      this.drawer.drawNextOutputPicture(width, height, data);
    }
  }

  _onBufferingHandler() {
    if (this.loader) {
      this.state = STATE.buffering;
      this.emit("buffering");
      this.loader.read().then((data) => {
        if (data.length) {
          this.processor.process(data);
        }
      });
    }
  }

  _onPreloadHandler() {
    if (this.loader) {
      this.loader.read().then((data) => {
        if (data.length) {
          this.processor.process(data);
        }
      });
    }
  }

  _onPlayingHandler() {
    if (this.state != STATE.playing) {
      this.state = STATE.playing;
      this.emit("playing");
    }
  }

  _onDecodeEndHandler() {
    this.isDecodeEnd = true;
  }
}

window.WXInlinePlayer = WXInlinePlayer;

export default WXInlinePlayer;
