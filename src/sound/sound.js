import Util from '../util/util';
import BrowserSound from './browser';
import WeChatSound from './wechat';

function Sound(opt) {
  return Util.isWeChat() ? new WeChatSound(opt) : new BrowserSound(opt);
}

window.Buffer = require('buffer').Buffer;
window.Sound = Sound;

export default Sound;
