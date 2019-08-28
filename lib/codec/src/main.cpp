#include "codec/codec.h"

Codec *codec;

extern "C" {
void codecInit() {
  if (codec == nullptr) {
    codec = new Codec();
  }
}

void codecSetBridgeName(char *bridgeName) {
  if (codec != nullptr) {
    codec->setBridgeName(string(bridgeName));
  }
}

void codecSetAudioBuffer(char *buffer) {
  if (codec != nullptr) {
    codec->setAudioBuffer((uint8_t *) buffer);
  }
}

void codecSetVideoBuffer(char *buffer) {
  if (codec != nullptr) {
    codec->setVideoBuffer((uint8_t *) buffer);
  }
}

void codecDecode(uint8_t *bytes, uint32_t length) {
  if (codec != nullptr) {
    codec->decode(bytes, length);
  }
}

int codecTry2Seek(char *buffer, uint32_t length) {
  if (codec != nullptr) {
    return codec->try2seek((uint8_t *) buffer, length);
  }
  return 1;
}

void codecFree() {
  if (codec != nullptr) {
    delete codec;
    codec = nullptr;
  }
}
}

//#include <fstream>
//#include <vector>
//
//int main() {
//  std::ifstream stream("C:\\work\\WXInlinePlayer\\lib\\codec\\bin\\mtv.flv", std::ios::in | std::ios::binary);
//  std::vector<uint8_t> data((std::istreambuf_iterator<char>(stream)), std::istreambuf_iterator<char>());
//  shared_ptr<Buffer> buffer = make_shared<Buffer>(data.data(), data.size());
//  buffer = make_shared<Buffer>(buffer->slice(0, 1024 * 1024));
//  Codec codec1;
//  codec1.decode(buffer->get_buf_ptr(), buffer->get_length());
//}