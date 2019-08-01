import EventEmitter from "eventemitter3";

const ops = [];
document.addEventListener(
  "WeixinJSBridgeReady",
  () => {
    setTimeout(function loop() {
      if (ops.length) {
        const { instance, op } = ops.shift();
        WeixinJSBridge.invoke("getNetworkType", {}, () => {
          instance[op]();
        });
      }
      setTimeout(loop, 1000 / 60);
    }, 1000 / 60);
  },
  false
);

class WXAudio extends EventEmitter {
  constructor({ src, format, volume, autoplay, muted }) {
    super();
    this.src = src;
    this.format = format;
    this.vol = volume;
    this.autoplay = autoplay;

    this.audio = new window.Audio();
    this.audio.src = src[0] || src;
    this.audio.preload = true;
    this.audio.controls = false;
    this.audio.loop = false;
    this.audio.autoplay = false;
    this.audio.volume = volume;
    this.audio.muted = muted;

    this.onPlay = () => this.emit("play");
    this.onEnd = () => this.emit("end");
    this.onError = () => this.emit("loaderror");
    this.audio.addEventListener("play", this.onPlay);
    this.audio.addEventListener("ended", this.onEnd);
    this.audio.addEventListener("error", this.onError);
  }

  play() {
    ops.push({
      instance: this.audio,
      op: "play"
    });
  }

  pause() {
    ops.push({
      instance: this.audio,
      op: "pause"
    });
  }

  volume(volume) {
    if (volume == null) {
      return this.vol;
    }

    this.vol = volume;
    this.audio.volume = volume;
  }

  mute(muted) {
    if (muted == null) {
      return this.muted;
    }

    this.muted = muted;
    this.audio.muted = muted;
  }

  seek(timestamp) {
    if (timestamp == null) {
      return this.audio.currentTime;
    }

    this.audio.currentTime = timestamp;
  }

  unload() {
    if (this.audio) {
      this.audio.removeEventListener("play", this.onPlay);
      this.audio.removeEventListener("ended", this.onEnd);
      this.audio.removeEventListener("error", this.onError);
      this.audio.pause();
      this.audio = null;
    }
  }
}

export default WXAudio;
