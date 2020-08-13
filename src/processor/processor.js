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
    this.averageUnitDuration = 0;
    this.averageDecodeCost = 0;
    this.soundHeadSliced = false;
    this.framerate = 1000 / 24;
    this.isEnded = false;
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
    
    if (this.sound) {
      this.sound.resume();
    }

    if (this.ticker) {
      this.ticker.add(this.tickHandler);
    }
    this.state = 'playing';//基于一致性考虑，这行应该放在函数末尾
  }

  destroy() {
    this.removeAllListeners();
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

  /**
   * a big function  with a lot logic
   */
  _onTickHandler() {
    if (this.state == 'created') {
      return;
    }

    ////////////////// case 1
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
        } else if (this.frames[this.bufferingIndex]) {
          const { timestamp } = this.frames[this.bufferingIndex];
          diff = lastFrameTimestamp - timestamp;
        }
      }

      if (
        !this.frames.length ||
        (!this.isEnded && diff && diff < this.minBufferingTime)
      ) {
        if (this.state != 'buffering') {
          this.emit('buffering');
        }
        this.sound.pause();
        this.state = 'buffering';
        return;
      } else {
        if (this.currentTime) {
          this.minBufferingTime = this.bufferingTime;
        }
        this.bufferingIndex = -1;
        if (this.state != 'buffering') {
          this.sound.resume();
        }
        if (this.blocked || !this.currentTime) {
          return;
        }
      }

      // simple solution to delay accumulation
      if (this.frames.length >= this.cacheSegmentCount * 1.5) {
        this.ticker.setFps(this.framerate * 3);
      } else if (this.frames.length < this.cacheSegmentCount / 3) {
        this.ticker.setFps(this.framerate / 1.5);
      } else {
        this.ticker.setFps(this.framerate);
      }

      for (let i = 0; i < this.frames.length; i++) {
        const { timestamp } = this.frames[i];
        const diff = this.currentTime - timestamp;
        if (Math.abs(diff) <= 25) {
          this.emit('frame', this.frames[i]);
          this.frames.splice(0, i + 1);
          break;
        }
      }
    } 
    ////////////////// case 2
    else if (this.hasAudio) {
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
    } 
    ////////////////// case 3
    else if (this.hasVideo) {
      if (!this.isEnded && this.state == 'buffering') {
        return;
      }

      if (!this.isEnded && this.frames.length < this.cacheSegmentCount / 3) {
        this.ticker.setFps(this.framerate / 1.5);
      }
      const frame = this.frames.shift();
      if (frame) {
        this.currentTime = frame.timestamp;
        this.emit('frame', frame);
        if (this.sound) {
          this.sound.setBlockedCurrTime(this.currentTime);
        }
      }
    }

    let diff = Number.MAX_SAFE_INTEGER;
    if (this.hasVideo && this.frames.length) {
      const lastIndex = this.frames.length - 1;
      const currentTime = this.currentTime;
      diff = this.frames[lastIndex].timestamp - currentTime;
    }

    if (
      !this.isEnded &&
      this.state != 'buffering' &&
      (this.hasVideo && !this.hasAudio) &&
      diff < this.bufferingTime
    ) {
      this.state = 'buffering';
      this.emit('buffering');
      return;
    }

    if (
      this.hasVideo &&
      this.state != 'preload' &&
      this.state != 'buffering' &&
      (this.frames.length < this.cacheSegmentCount ||
        diff < this.averageDecodeCost * 1.3)
    ) {
      this.state = 'preload';
      this.emit('preload');
    }
  }

  /**
   * another big function with a lot logic
   * @param {*} msg 
   */
  _onCodecMsgHandler(msg) {
    if (this.state == 'destroy') {
      return;
    }

    const { type } = msg;
    switch (type) {
      case 'ready': {
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
        this.emit('header', msg.data);
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
              this.framerate = framerate;
              this.ticker.setFps(framerate);
              break;
            }
          }
        }

        this.emit('mediaInfo', msg.data);
        break;
      }
      case 'video': {
        const {
          timestamp,
          width,
          height,
          stride0,
          stride1,
          buffer
        } = msg.data;
        if (!this.baseTime) {
          this.baseTime = timestamp;
        }

        this.frames.push({
          data: Buffer.from(new Uint8Array(buffer)),
          timestamp: timestamp - this.baseTime,
          width,
          height,
          stride0,
          stride1
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
          (this.hasVideo && this.state != 'playing' && this.state != 'paused') ||
          (!this.hasVideo && this.hasAudio && this.state != 'playing' && this.state != 'paused')
        ) {
          this.emit('playing');
          this.state = 'playing';        
        } 
        this.ticker.setFps(this.framerate);

        const { consume, duration } = msg.data;

        if (!this.averageDecodeCost) {
          this.averageDecodeCost = consume;
        } else {
          this.averageDecodeCost += consume;
          this.averageDecodeCost /= 2.0;
        }

        if (!this.averageUnitDuration) {
          this.averageUnitDuration = duration;
        } else {
          this.averageUnitDuration += duration;
          this.averageUnitDuration /= 2.0;
        }

        this.emit('performance', {
          averageDecodeCost: this.averageDecodeCost,
          averageUnitDuration: this.averageUnitDuration
        });

        if (this.hasAudio) {
          this.currentTime = this.getCurrentTime();
          if (!this.soundHeadSliced) {
            this.soundHeadSliced = true;
            if (this.frames.length) {
              const frame = this.frames.shift();
              this.emit('frame', frame);
            }
            this.sound.decode(Buffer.concat(this.audios.splice(0, 32)));
          }
          this.sound.decode(Buffer.concat(this.audios));
          this.audios = [];
        }
        break;
      }
      case 'complete': {
        this.isEnded = true;
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
