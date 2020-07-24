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
const AudioContext = window.webkitAudioContext || window.AudioContext;

class BrowserSound extends EventEmitter {
  constructor({ volume, muted }) {
    super();
    this.duration = 0;
    this.state = 'blocked';
    this.blockedCurrTime = 0;
    this.skimmedTime = 0;

    this.vol = volume;
    this.muted = muted;
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.muted ? 0.0 : this.vol;
    this.gainNode.connect(this.context.destination);

    this.audioSrcNodes = [];
    this.playStartedAt = 0;
    this.totalTimeScheduled = 0;
    this.data = Buffer.alloc(0);
  }

  setBlockedCurrTime(currTime = 0) {
    this.blockedCurrTime = currTime;
    for (let i = 0; i < this.audioSrcNodes.length; i++) {
      const { timestamp } = this.audioSrcNodes[i];
      if (currTime <= timestamp * 1000) {
        const nodes = this.audioSrcNodes.splice(0, !i ? 0 : i - 1);
        nodes.forEach(({ source }) => {
          source.onended = null;
          source.disconnect();
        });
        break;
      }
    }
  }

  unblock(offset) {
    if (this.state != 'blocked') {
      return;
    }

    this.state = 'running';
    this.resume();
    this.setBlockedCurrTime(offset);

    this.playStartedAt = 0;
    this.totalTimeScheduled = 0;
    for (let i = 0; i < this.audioSrcNodes.length; i++) {
      const { source, timestamp, duration } = this.audioSrcNodes[i];
      source.onended = null;
      source.disconnect();

      const audioSrc = this.context.createBufferSource();
      audioSrc.onended = this._onAudioBufferEnded.bind(this);
      if (!this.playStartedAt) {
        const { currentTime, baseLatency, sampleRate } = this.context;
        const startDelay = duration + (baseLatency || 128 / sampleRate);
        this.playStartedAt = currentTime + startDelay;
      }

      audioSrc.buffer = source.buffer;
      try {
        audioSrc.connect(this.gainNode);
        audioSrc.start(
          this.totalTimeScheduled + this.playStartedAt,
          !i ? offset / 1000 - timestamp : 0
        );
      } catch (e) {}

      this.audioSrcNodes[i].source = audioSrc;
      this.audioSrcNodes[i].timestamp = this.totalTimeScheduled;
      this.totalTimeScheduled += duration;
    }
  }

  getAvaiableDuration() {
    return this.duration;
  }

  getCurrentTime() {
    if (this.context) {
      return this.state == 'blocked'
        ? this.blockedCurrTime
        : this.context.currentTime - this.playStartedAt + this.skimmedTime;
    }
    return 0.0;
  }

  volume(vol) {
    if (vol != null) {
      this.vol = vol;
      this.gainNode.gain.value = this.muted ? 0.0 : vol;
    }
    return this.vol;
  }

  mute(muted) {
    if (muted != null) {
      this.muted = muted;
      this.gainNode.gain.value = this.muted ? 0.0 : this.vol;
    }
    return this.muted;
  }

  pause() {
    if(this.state == 'paused'){
      return;
    }
    this.state = 'paused';

    if (this.context) {
      return this.context.suspend();
    }
    return Promise.resolve();
  }

  resume() {
    if(this.state == 'running'){
      return;
    }
    this.state = 'running';

    if (this.context) {
      return this.context.resume();
    }
    return Promise.resolve();
  }

  decode(data) {
    if (data.length) {
      data = Buffer.from(data);
      this.data = Buffer.concat([this.data, data]);
      if (this.context) {
        return new Promise(resolve => {
          this.context.decodeAudioData(
            this.data.buffer,
            buffer => {
              this._onDecodeSuccess(buffer);
              resolve();
            },
            error => {
              this._onDecodeError(error);
              resolve();
            }
          );
        });
      }
    }
    return Promise.resolve();
  }

  destroy() {
    this.removeAllListeners();
    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.data = null;
    this.gainNode = null;
    this.audioSrcNodes = [];
    this.state = 'destroy';
  }

  _onDecodeSuccess(audioBuffer) {
    const audioSrc = this.context.createBufferSource();
    audioSrc.onended = this._onAudioBufferEnded.bind(this);

    if (!this.playStartedAt) {
      const { duration } = audioBuffer;
      const { currentTime, baseLatency, sampleRate } = this.context;
      const startDelay = duration + (baseLatency || 128 / sampleRate);
      this.playStartedAt = currentTime + startDelay;
    }

    audioSrc.buffer = audioBuffer;
    if (this.state == 'running') {
      try {
        audioSrc.connect(this.gainNode);
        audioSrc.start(this.totalTimeScheduled + this.playStartedAt);
      } catch (e) {}
    }

    this.audioSrcNodes.push({
      source: audioSrc,
      duration: audioBuffer.duration,
      timestamp: this.totalTimeScheduled
    });

    this.totalTimeScheduled += audioBuffer.duration;
    this.duration += audioBuffer.duration;

    this.data = Buffer.alloc(0);
    this.emit('decode:success');
  }

  _onDecodeError(e) {
    this.emit('decode:error', e);
  }

  _onAudioBufferEnded() {
    const { source } = this.audioSrcNodes.shift();
    source.disconnect();
  }
}

export default BrowserSound;
