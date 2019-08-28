import { Buffer } from 'buffer';
import EventEmitter from 'eventemitter3';
import Ticker from '../util/ticker';
import Sound from '../sound/sound';
import Util from '../util/util';

class Processor extends EventEmitter {
  constructor({
    volume = 1.0,
    muted = false,
    preloadTime = 1000,
    bufferingTime = 3000,
    cacheSegmentCount = 128
  }) {
    super();
    this.state = 'created';
    this.baseTime = 0;
    this.blocked = !Util.isWeChat();
    this.hasVideo = true;
    this.hasAudio = true;
    this.frames = [];
    this.audios = [];
    this.currentTime = 0;
    this.bufferingIndex = -1;
    this.minBufferingTime = preloadTime;
    this.bufferingTime = bufferingTime;
    this.cacheSegmentCount = cacheSegmentCount;
    this.ticker = new Ticker();
    this.sound = new Sound({ volume, muted });
    this.codec = new H264Codec();

    this.tickHandler = this._onTickHandler.bind(this);
    this.ticker.add(this.tickHandler);
    this.codec.onmessage = this._onCodecMsgHandler.bind(this);
  }

  getAvaiableDuration() {
    if (this.hasAudio) {
      if (this.sound) {
        return this.sound.getAvaiableDuration() * 1000;
      }
    }

    if (this.hasVideo) {
      if (this.frames.length) {
        return this.frames[this.frames.length - 1].timestamp;
      }
    }

    return 0;
  }

  getCurrentTime() {
    if (this.hasAudio) {
      return this.sound ? this.sound.getCurrentTime() * 1000 : 0.0;
    } else if (this.hasVideo) {
      return this.currentTime;
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
    if (Util.isWeChat()) {
      /*--------Dont Need To Implemented-------*/
    } else if (this.sound) {
      this.blocked = false;
      this.sound.unblock(0);
    }
  }

  volume(volume) {
    if (volume == null) {
      return this.sound ? this.sound.volume() : 0.0;
    } else {
      if (this.sound) {
        this.sound.volume(volume);
      }
    }
  }

  mute(muted) {
    if (muted == null) {
      return this.sound ? this.sound.mute() : true;
    } else {
      if (this.sound) {
        this.sound.mute(muted);
      }
    }
  }

  pause() {
    if (this.state == 'pasued') {
      return;
    }

    if (this.sound) {
      this.sound.pause();
    }

    if (this.ticker) {
      this.ticker.remove(this.tickHandler);
    }
    this.state = 'paused';
  }

  resume() {
    if (this.state == 'playing') {
      return;
    }

    this.state = 'playing';
    if (this.sound) {
      this.sound.resume();
    }

    if (this.ticker) {
      this.ticker.add(this.tickHandler);
    }
  }

  destroy() {
    this.removeAllListeners();
    if (this.ticker) {
      this.ticker.destroy();
      this.tickHandler = null;
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
    if (this.state == 'created') {
      return;
    }

    if (this.hasAudio && this.hasVideo) {
      let diff = 0;
      let lastIndex = 0;
      this.currentTime = this.getCurrentTime();
      if (this.frames.length) {
        lastIndex = this.frames.length - 1;
        const { timestamp: lastFrameTimestamp } = this.frames[lastIndex];
        if (this.bufferingIndex == -1) {
          this.bufferingIndex = lastIndex;
          diff = lastFrameTimestamp - this.currentTime;
        } else {
          const { timestamp } = this.frames[this.bufferingIndex];
          diff = lastFrameTimestamp - timestamp;
        }
      }

      if (!this.frames.length || (diff && diff < this.minBufferingTime)) {
        if (this.state != 'buffering' && this.state != 'preload') {
          this.sound.pause();
          this.emit('buffering');
        }
        this.state = 'buffering';
        return;
      } else {
        if (this.currentTime) {
          this.minBufferingTime = this.bufferingTime;
        }
        this.bufferingIndex = -1;
        this.sound.resume();
        if (this.blocked || !this.currentTime) {
          return;
        }
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
    } else if (this.hasAudio) {
      const duration = this.sound.getAvaiableDuration() * 1000;
      const bufferTime = this.bufferingTime;
      this.currentTime = this.getCurrentTime();
      if (
        this.state != 'preload' &&
        this.currentTime > 0 &&
        duration - this.currentTime < bufferTime
      ) {
        this.state = 'preload';
        this.emit('preload');
      }
    } else if (this.hasVideo) {
      const frame = this.frames.shift();
      if (frame) {
        this.currentTime = frame.timestamp;
        this.emit('frame', frame);
        if (this.sound) {
          this.sound.setBlockedCurrTime(this.currentTime);
        }
      }
    }

    if (
      this.hasVideo &&
      this.state != 'preload' &&
      this.state != 'buffering' &&
      this.frames.length < this.cacheSegmentCount
    ) {
      this.state = 'preload';
      this.emit('preload');
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
        if (
          this.state == 'buffering' ||
          (!this.hasVideo && this.hasAudio && this.state != 'playing')
        ) {
          this.emit('playing');
        }

        this.state = 'playing';
        if (this.hasAudio) {
          this.currentTime = this.getCurrentTime();
          const buffer = Buffer.concat(this.audios);
          this.sound.decode(buffer);
          this.audios = [];
        }
        break;
      }
      case 'complete': {
        this.state = 'end';
        this.emit('end');
        break;
      }
      default: {
        break;
      }
    }
  }
}

export default Processor;
