import Promise from 'promise-polyfill';
import BrowserSound from './browser';

const calls = [];
document.addEventListener(
  'WeixinJSBridgeReady',
  () => {
    setTimeout(function loop() {
      if (calls.length) {
        WeixinJSBridge.invoke('getNetworkType', {}, calls.shift());
      }
      setTimeout(loop, 1000 / 60);
    }, 1000 / 60);
  },
  false
);

class WeChatSound extends BrowserSound {
  constructor(opt) {
    super(opt);
    this.state = 'running';
    this.resume();
  }

  setBlockedCurrTime(currTime = 0) {
    /*--------Dont Need To Implemented-------*/
  }

  unblock(offset) {
    /*--------Dont Need To Implemented-------*/
  }

  volume(vol) {
    if (!vol) {
      return this.volume;
    }
    calls.push(() => {
      super.volume(vol);
    });
  }

  mute(muted) {
    if (muted == null) {
      return this.muted;
    }
    calls.push(() => {
      super.mute(muted);
    });
  }

  pause() {
    return new Promise(resolve => {
      calls.push(() => {
        super.pause();
        resolve();
      });
    });
  }

  resume() {
    return new Promise(resolve => {
      calls.push(() => {
        super.resume();
        resolve();
      });
    });
  }
}

export default WeChatSound;
