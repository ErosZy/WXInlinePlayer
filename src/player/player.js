import EventEmitter from "eventemitter3";
import H264bsdCanvas from "./drawer";
import FLV2H264 from "../../lib/flv2h264/build/flv2h264.0.2.0";
import Sound from "../sound/sound";
import Ticker from "../util/ticker";
import Loader from "../util/loader";
import Promise from "bluebird";

const MAX_TS_DIFF = 25;
const MIN_TS_DIFF = -100;

class Player extends EventEmitter {
  static id = 0;
  static TinyH264 = null;
  static isInited = false;
  static initPromise = null;

  static init({ asmUrl, wasmUrl }) {
    initPromise = new Promise((resolve, reject) => {
      const url = window["WebAssembly"] ? wasmUrl : asmUrl;
      const head = document.head || document.getElementsByTagName("head")[0];
      const script = document.createElement("script");
      script.onload = () => {
        Player.TinyH264 = window.TinyH264;
        Player.isInited = true;
        resolve();
      };
      script.onerror = e => reject(e);
      script.src = `${url}`;
      script.type = "text/javascript";
      head.appendChild(script);
    });

    return initPromise;
  }

  static isSupport() {
    return !!(
      window.URL &&
      window.URL.createObjectURL &&
      window.Blob &&
      window.Audio &&
      !!new Audio().canPlayType("audio/aac;").replace(/^no$/, "") &&
      (window.AudioContext || window.webkitAudioContext) &&
      document.createElement("canvas").getContext
    );
  }

  static ready() {
    if (!Player.isSupport()) {
      return Promise.resolve(false);
    }

    if (Player.isInited) {
      return Promise.resolve(true);
    }

    return initPromise;
  }

  constructor({
    url,
    $container,
    volume = 1.0,
    muted = false,
    autoplay = false,
    loop = false
  }) {
    super();
    this.id = Player.id++;
    this.url = url;
    this.blobUrl = null;
    this.vol = volume;
    this.muted = muted;
    this.$container = $container || document.body;
    this.$elem = document.createElement("canvas");
    this.$container.appendChild(this.$elem);
    this.drawer = new H264bsdCanvas(this.$elem);
    this.autoplay = autoplay;
    this.loop = loop;
    this.audioNalus = [];
    this.videoNalus = [];
    this.frames = [];
    this.flv2h264 = null;
    this.h264Codec = null;
    this.samples = null;
    this.index = 0;
    this.timestamp = 0;
    this.isPlaying = false;
    this.codecSegs = [];
    this.mediaInfo = {};
    this.loopTimer = null;
    this.autoPlayTimer = null;
    this.playTimeout = true;
    this.renderTimestamp = 0;
    this.framerate = 0;
    this.destroyed = false;

    this.loader = new Loader();
    this.loader
      .load({ url: url })
      .then(this.onLoadSuccess.bind(this))
      .catch(this.onLoadError.bind(this));
  }

  play() {
    if (this.isPlaying) {
      return;
    }

    if (!this.h264Codec) {
      this.h264Codec = new Player.TinyH264();
      this.h264Codec.onmessage = this.onH264Message.bind(this);
      return;
    }

    this.isPlaying = true;
    this.renderTimestamp = 0;
    this.playTimeout = false;
    const buffer = Buffer.concat(this.audioNalus.map(v => v.data));
    const blob = new Blob([buffer], { type: "audio/aac" });
    const url = (this.blobUrl = window.URL.createObjectURL(blob));
    this.sound = new Sound({
      src: [url],
      format: ["aac"],
      volume: this.vol,
      autoplay: this.autoplay,
      muted: this.muted
    });

    this.sound.on("play", () => {
      if (this.sound) {
        this.sound.seek(this.renderTimestamp / 1000);
      }
      if (!this.playTimeout) {
        this.onSoundPlay();
      }
    });

    this.sound.on("end", this.onSoundEnd.bind(this));
    this.sound.on("loaderror", this.onSoundError.bind(this));
    this.sound.on("playerror", this.onSoundError.bind(this));

    this.autoPlayTimer = setTimeout(() => {
      this.emit("playtimeout");
      this.playTimeout = true;
      this.onSoundPlay();
    }, 500);

    this.sound.play();
  }

  pause() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    Ticker.removeEventListener("tick", this.tick);
    if (this.sound) {
      this.sound.pause();
    }
  }

  resume() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.tick = this.onTick.bind(this);
    Ticker.addEventListener("tick", this.tick);
    if (this.sound) {
      this.sound.play();
    }
  }

  stop() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    Ticker.framerate = 0;
    Ticker.removeEventListener("tick", this.tick);
    clearTimeout(this.autoPlayTimer);
    clearTimeout(this.loopTimer);

    if (this.loader) {
      this.loader.abort();
      this.loader = null;
    }

    if (this.flv2h264) {
      this.flv2h264.destroy();
      this.flv2h264 = null;
    }

    if (this.h264Codec) {
      this.h264Codec.destroy();
      this.h264Codec = null;
    }

    if (this.sound) {
      this.sound.unload();
      this.sound = null;
    }

    if (this.blobUrl) {
      window.URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }

    this.frames = [];
    this.index = 0;
    this.timestamp = 0;
    this.isPlaying = false;
    this.framerate = 0;
    this.renderTimestamp = 0;
    this.emit("stop");
  }

  volume(volume) {
    if (volume == null) {
      return this.vol;
    }

    if (this.sound) {
      this.sound.volume(volume);
    }

    return 1.0;
  }

  mute(muted) {
    if (muted == null) {
      return this.muted;
    }

    if (this.sound) {
      this.muted = muted;
      return this.sound.mute(muted);
    }

    return false;
  }

  resize(containerWidth, containerHeight) {
    const head = document.getElementsByTagName("head")[0];
    const styleId = `__wx_inline_${this.id}__`;
    let $style = document.getElementById(styleId);
    if ($style) {
      $style.parentNode.removeChild($style);
    }
    $style = document.createElement("style");
    $style.id = styleId;
    $style.type = "text/css";

    const { width = 320, height = 640 } = this.mediaInfo || {};
    const clientWidth = containerWidth || this.$container.clientWidth;
    const clientHeight = containerHeight || this.$container.clientHeight;
    const scaleX = clientWidth / width;
    const scaleY = clientHeight / height;
    const scale = scaleY > scaleX ? scaleY : scaleX;
    let translateX = (clientWidth - width) / (2 * scale);
    let translateY = (clientHeight - height) / (2 * scale);

    this.$elem.width = this.mediaInfo.width;
    this.$elem.height = this.mediaInfo.height;

    const className = `__wx_inline_player_${this.id}__`;
    const cssText = `
      .${className} {
        width: ${this.$elem.width}px !important;
        height: ${this.$elem.height}px !important;
        transform: scale(${scale}) translate(${translateX}px,${translateY}px);
        -webkit-transform: scale(${scale}) translate(${translateX}px,${translateY}px);
        -moz-transform: scale(${scale}) translate(${translateX}px,${translateY}px);
        -o-transform: scale(${scale}) translate(${translateX}px,${translateY}px);
        -ms-transform: scale(${scale}) translate(${translateX}px,${translateY}px);
      }
    `;

    if ($style.styleSheet) {
      $style.styleSheet.cssText = cssText;
    } else {
      $style.appendChild(document.createTextNode(cssText));
    }

    head.appendChild($style);

    const __className = this.$container.className;
    if (__className.indexOf(className) == -1) {
      this.$container.className = __className + " " + className;
    }
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.isPlaying = true;
    this.destroyed = true;
    this.off();
    this.stop();
    if (this.drawer) {
      this.drawer.destroy();
      this.drawer = null;
    }

    this.codecSegs = [];
    this.audioNalus = [];
    this.videoNalus = [];
    this.samples = null;

    const styleId = `__wx_inline_${this.id}__`;
    let className = this.$container.className;
    className = className.replace(styleId, "");
    className = className.replace(/^\s+|\s+$/g, "");
    this.$elem.parentNode.removeChild(this.$elem);
    this.$elem = null;

    let $style = document.getElementById(styleId);
    if ($style) {
      $style.parentNode.removeChild($style);
    }
  }

  onLoadSuccess(buffer) {
    this.samples = Buffer.from(buffer || []);
    if (this.samples == null || !this.samples.length) {
      return;
    }

    if (!this.h264Codec) {
      this.h264Codec = new Player.TinyH264();
      this.h264Codec.onmessage = this.onH264Message.bind(this);
    }
  }

  onLoadError(error) {
    this.emit("load:error", error);
  }

  onMediaInfo(info) {
    info = info.objects[0].objectData.value;
    for (let i = 0; i < info.length; i++) {
      const { varName, varData } = info[i];
      this.mediaInfo[varName.data] = varData.value.data || varData.value;
    }

    this.resize();
  }

  onVideoNalus(nalu) {
    const { type } = nalu;
    if (type == "sps" || type == "pps") {
      this.codecSegs.push(nalu.data);
      this.h264Codec && this.h264Codec.decode(nalu.data);
    } else {
      this.videoNalus.push(nalu);
    }
  }

  onAudioNalus(nalu) {
    this.audioNalus.push(nalu);
  }

  onVideoComplete() {
    this.emit("load:success");
    if (this.autoplay) {
      this.play();
    }
  }

  onH264Message(msg) {
    const { type } = msg;
    switch (type) {
      case "decoderReady": {
        if (this.audioNalus.length && this.videoNalus.length) {
          this.codecSegs.forEach(v => {
            if (this.h264Codec) {
              this.h264Codec.decode(v);
            }
          });
          this.play();
          return;
        }
        this.flv2h264 = new FLV2H264();
        this.flv2h264.on("mediaInfo", this.onMediaInfo.bind(this));
        this.flv2h264.on("video:nalus", this.onVideoNalus.bind(this));
        this.flv2h264.on("audio:nalus", this.onAudioNalus.bind(this));
        this.flv2h264.on("video:complete", this.onVideoComplete.bind(this));
        this.flv2h264.decode(this.samples);
        break;
      }
      case "pictureReady": {
        msg.timestamp = this.timestamp;
        this.frames.push(msg);
        break;
      }
    }
  }

  onSoundPlay() {
    clearTimeout(this.autoPlayTimer);
    const t0 = this.audioNalus[0].timestamp;
    const t1 = this.audioNalus[1].timestamp;
    const framerate = (this.framerate = t1 - t0);
    const loop = () => {
      if (this.frames.length >= 128) {
        this.loopTimer = setTimeout(loop, 1000 / 60);
        return;
      }

      if (!this.isPlaying) {
        this.loopTimer = setTimeout(loop, 1000 / 60);
        return;
      }

      const item = this.videoNalus[this.index++];
      if (item) {
        const { data, timestamp } = item;
        this.timestamp = timestamp;
        this.h264Codec.decode(data);
        this.loopTimer = setTimeout(loop, 1000 / 60);
      }
    };

    loop();
    Ticker.framerate = framerate * 1.2;
    this.tick = this.onTick.bind(this);
    Ticker.addEventListener("tick", this.tick);
    this.emit("play");
  }

  onSoundEnd() {
    Ticker.framerate = 0;
    Ticker.removeEventListener("tick", this.tick);

    this.stop();
    if (this.loop) {
      this.play();
    }
  }

  onSoundError() {
    clearTimeout(this.autoPlayTimer);
    this.onSoundPlay();
  }

  onTick() {
    if (!this.sound) {
      return;
    }

    let frame = null;
    const audioCurTimestamp = this.sound ? this.sound.seek() * 1000 : NaN;
    if (!isNaN(audioCurTimestamp)) {
      for (let i = 0; i < this.frames.length; i++) {
        const item = this.frames[i];
        const diff = item.timestamp - audioCurTimestamp;
        if (
          (diff >= 0 && diff <= MAX_TS_DIFF) ||
          (diff < 0 && diff >= MIN_TS_DIFF)
        ) {
          this.frames = this.frames.slice(i + 1);
          frame = item;
          break;
        }
      }
    } else {
      frame = this.frames.shift();
      const { timestamp } = frame || {};
      const { lasttimestamp } = this.mediaInfo;
      const diff = frame ? Math.abs(timestamp - lasttimestamp * 1000) : 1000;
      if (diff <= this.framerate) {
        this.onSoundEnd();
      }
    }

    if (frame) {
      const { width, height, data } = frame;
      this.renderTimestamp = frame.timestamp;
      this.drawer.drawNextOutputPicture(
        width,
        height,
        null,
        new Uint8Array(data)
      );
    }
  }
}

export default Player;
