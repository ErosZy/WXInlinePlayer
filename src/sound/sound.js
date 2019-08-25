import { Buffer } from 'buffer';
import EventEmitter from 'eventemitter3';
const AudioContext = window.webkitAudioContext || window.AudioContext;
class Sound extends EventEmitter {
  constructor() {
    super();
    this.index = 0;
    this.vol = 1.0;
    this.muted = false;
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.muted ? 0.0 : this.vol;
    this.gainNode.connect(this.context.destination);

    this.audioSrcNodes = [];
    this.playStartedAt = 0;
    this.totalTimeScheduled = 0;
    this.data = Buffer.alloc(0);
  }

  getAvaiableDuration() {
    return this.totalTimeScheduled;
  }

  getCurrentTime() {
    if (this.context) {
      return this.context.currentTime;
    }
    return 0.0;
  }

  volume(vol) {
    if (vol) {
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
    if (this.context) {
      return this.context.suspend();
    }
    return Promise.resolve();
  }

  resume() {
    if (this.context) {
      return this.context.resume();
    }
    return Promise.resolve();
  }

  decode(data) {
    data = Buffer.from(data);
    this.data = Buffer.concat([this.data, data]);
    if (this.context) {
      this.context.decodeAudioData(
        this.data.buffer,
        this._onDecodeSuccess.bind(this),
        this._onDecodeError.bind(this)
      );
    }
  }

  _onDecodeSuccess(audioBuffer) {
    const audioSrc = this.context.createBufferSource();
    audioSrc.index = this.audioSrcNodes.length;
    audioSrc.onended = this._onAudioBufferEnded.bind(
      this,
      this.audioSrcNodes.length
    );

    if (!this.playStartedAt) {
      const { duration } = audioBuffer;
      const { baseLatency, sampleRate, currentTime } = this.context;
      const delay = duration + (baseLatency || 128 / sampleRate);
      this.playStartedAt = currentTime + delay;
    }

    audioSrc.buffer = audioBuffer;
    audioSrc.connect(this.gainNode);
    audioSrc.start(this.playStartedAt + this.totalTimeScheduled);
    this.totalTimeScheduled += audioBuffer.duration;

    this.audioSrcNodes.push({
      source: audioSrc,
      timestamp: this.playStartedAt + this.totalTimeScheduled
    });

    this.data = Buffer.alloc(0);
    this.emit('decode:success');
  }

  _onDecodeError(e) {
    this.emit('decode:error', e);
  }

  _onAudioBufferEnded(index) {
    this.index = index;
    const { source } = this.audioSrcNodes.shift();
    source.disconnect();
  }
}

window.Buffer = Buffer;
window.Sound = Sound;
// export default Sound;
