import HWAudio from "./hwaudio";
import WXAudio from "./wxaudio";

class Sound {
  constructor(opt) {
    if (/MicroMessenger/i.test(window.navigator.userAgent)) {
      return new WXAudio(opt);
    } else {
      return new HWAudio(opt);
    }
  }
}

export default Sound;
