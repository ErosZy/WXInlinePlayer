export default {
  isWeChat() {
    return /MicroMessenger/i.test(window.navigator.userAgent);
  }
};
