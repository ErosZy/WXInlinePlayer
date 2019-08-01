import EventEmitter from "eventemitter3";
import { Howl } from "../../lib/howler.js/dist/howler";

class HWAudio extends EventEmitter {
  constructor({ src, format, volume, autoplay, muted }) {
    super();
    this.src = src;
    this.format = format;
    this.vol = volume;
    this.autoplay = autoplay;
    this.muted = muted;
    this.howler = null;
    this.isPuased = false;
  }

  play() {
    if (!this.howler) {
      this.howler = new Howl({
        src: this.src,
        format: ["aac"],
        volume: this.vol,
        mute: this.muted,
        autoplay: this.autoplay,
        loop: false,
        html5: false
      });
      
      this.onPlay = () => this.emit("play");
      this.onEnd = () => this.emit("end");
      this.onLoadError =  () => this.emit("loaderror");
      this.onPlayError = () => this.emit("playerror");
      this.onUnlock = () => {
        this.isPuased && this.howler.pause();
      };

      this.howler.on("play", this.onPlay);
      this.howler.on("end", this.onEnd);
      this.howler.on("loaderror", this.onLoadError);
      this.howler.on("playerror", this.onPlayError);
      this.howler.on("unlock", this.onUnlock);
    }

    this.howler.play();
  }

  pause() {
    if (this.howler) {
      this.isPuased = true;
      this.howler.pause();
    }
  }

  volume(volume) {
    if (volume == null) {
      return this.vol;
    }

    if (this.howler) {
      this.vol = volume;
      this.howler.volume(volume);
    }
  }

  mute(muted) {
    if (muted == null) {
      return this.muted;
    }

    this.muted = muted;
    this.howler.mute(muted);
  }

  seek(timestamp) {
    if (timestamp == null) {
      return this.howler ? this.howler.seek() : 0;
    }

    if (this.howler) {
      this.howler.seek(timestamp);
    }
  }

  unload() {
    if (this.howler) {
      this.howler.off("play", this.onPlay);
      this.howler.off("end", this.onEnd);
      this.howler.off("loaderror", this.onLoadError);
      this.howler.off("playerror", this.onPlayError);
      this.howler.off("unlock", this.onUnlock);
      this.howler.unload();
      this.howler = null;
    }
  }
}

export default HWAudio;
