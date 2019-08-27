import { Buffer } from 'buffer';
import EventEmitter from 'eventemitter3';
import Ticker from '../util/ticker';
import Sound from '../sound/sound';

class Processor extends EventEmitter {
  constructor({ minBufferingTime = 3000, minCacheSegments = 128 }) {
    super();
    this.state = 'created';
    this.baseTime = 0;
    this.hasVideo = 1;
    this.hasAudio = 1;
    this.frames = [];
    this.audios = [];
    this.currentTime = 0;
    this.bufferingFactor = 1;
    this.bufferingIndex = -1;
    this.minBufferingTime = minBufferingTime;
    this.minCacheSegments = minCacheSegments;
    this.ticker = new Ticker();
    this.sound = new Sound();
    this.codec = new H264Codec();

    this.ticker.add(this._onTickHandler.bind(this));
    this.codec.onmessage = this._onCodecMsgHandler.bind(this);
  }

  getCurrentTime() {
    if (this.hasVideo) {
      return this.currentTime;
    } else if (this.hasAudio) {
      return this.sound.getCurrentTime() * 1000;
    } else {
      return 0;
    }
  }

  process(buffer) {
    if (this.codec) {
      this.codec.decode(buffer);
    }
  }

  unblock() {
    if (this.sound) {
      this.sound.unblock(0);
    }
  }

  pause() {}

  resume() {}

  destroy() {
    if (this.ticker) {
      this.ticker.destroy();
    }

    if (this.sound) {
      this.sound.destroy();
    }

    if (this.codec) {
      this.codec.destroy();
    }

    this.frames = [];
    this.audios = [];
    this.ticker = null;
    this.sound = null;
    this.codec = null;
    this.state = 'destroy';
  }

  _onTickHandler() {
    if (!this.frames.length) {
      return;
    }

    if (this.hasAudio) {
      this.currentTime = this.sound.getCurrentTime() * 1000;
      const lastIndex = this.frames.length - 1;
      const lastFrameTimestamp = this.frames[lastIndex].timestamp;
      let diff = 0;
      if (this.bufferingIndex == -1) {
        this.bufferingIndex = lastIndex;
        diff = lastFrameTimestamp - this.currentTime;
      } else {
        diff = lastFrameTimestamp - this.frames[this.bufferingIndex].timestamp;
      }

      if (diff < this.minBufferingTime * this.bufferingFactor) {
        if (this.state != 'buffering' && this.state != 'preload') {
          this.sound.pause();
          this.emit('buffering');
        }
        this.state = 'buffering';
        return;
      } else {
        this.bufferingIndex = -1;
        this.sound.resume();
      }

      for (let i = 0; i < this.frames.length; i++) {
        const { timestamp } = this.frames[i];
        const diff = this.currentTime - timestamp;
        if ((diff > 0 && diff <= 25) || (diff < 0 && diff >= -100)) {
          this.emit('frame', this.frames[i]);
          this.frames.splice(0, i);
          break;
        }
      }

      if (
        this.state != 'preload' &&
        this.frames.length < this.minCacheSegments
      ) {
        this.state = 'preload';
        this.emit('preload');
      }
    } else {
      const frame = this.frames.shift();
      this.currentTime = frame.timestamp;
      this.emit('frame', frame);
    }
  }

  _onCodecMsgHandler(msg) {
    const { type } = msg;
    switch (type) {
      case 'ready': {
        this.state = 'buffering';
        this.emit('buffering');
        break;
      }
      case 'header': {
        const { hasVideo, hasAudio } = msg.data;
        this.hasVideo = hasVideo;
        this.hasAudio = hasAudio;
        if (!this.hasAudio) {
          this.sound.destroy();
          this.sound = null;
        }
        if (!this.hasVideo) {
          this.ticker.destroy();
          this.ticker = null;
        }
        break;
      }
      case 'mediaInfo': {
        try {
          msg.data = JSON.parse(msg.data);
        } catch (e) {}

        const info = msg.data['onMetaData'] || [];
        if (this.ticker) {
          for (let i = 0; i < info.length; i++) {
            const { framerate } = info[i];
            if (framerate) {
              this.ticker.setFps(framerate);
              break;
            }
          }
        }

        this.emit('mediaInfo', msg.data);
        break;
      }
      case 'video': {
        const { timestamp, width, height, buffer } = msg.data;
        if (!this.baseTime) {
          this.baseTime = timestamp;
        }
        this.frames.push({
          data: Buffer.from(new Uint8Array(buffer)),
          timestamp: timestamp - this.baseTime,
          width,
          height
        });
        break;
      }
      case 'audio': {
        const { timestamp, buffer } = msg.data;
        if (!this.baseTime) {
          this.baseTime = timestamp;
        }
        this.audios.push(Buffer.from(new Uint8Array(buffer)));
        break;
      }
      case 'decode': {
        this.currentTime = this.sound.getCurrentTime() * 1000;
        const buffer = Buffer.concat(this.audios);
        this.sound.decode(buffer);
        this.audios = [];
        this.state = 'playing';
        break;
      }
      case 'complete': {
        this.emit('end');
        break;
      }
      default: {
        break;
      }
    }
  }
}

window.Processor = Processor;
export default Processor;
