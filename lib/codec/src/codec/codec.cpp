#include "codec.h"

void Codec::decode(uint8_t *bytes, uint32_t byteLen) {
  shared_ptr<Buffer> buffer = make_shared<Buffer>(bytes, byteLen);
  _decoder->decode(buffer);
}

uint32_t Codec::try2seek(uint8_t *bytes, uint32_t byteLen) {
  shared_ptr<Buffer> buffer = make_shared<Buffer>(bytes, byteLen);
  return 0;
}