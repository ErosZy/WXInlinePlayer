#include "header.h"

const uint8_t Header::FLV_CHARS[] = {70, 76, 86};

HeaderValue Header::decode(shared_ptr<Buffer> &buffer) {
  _signature = buffer->slice(0, 3);
  _version = buffer->read_uint8(3);
  if (0 != memcmp(_signature.get_buf_ptr(), Header::FLV_CHARS, _signature.get_length()) || _version != 0x01) {
    return HeaderValue(true);
  }

  uint8_t flags = buffer->read_uint8(4);
  _hasAudio = (flags & 4) >> 2 == 1;
  _hasVideo = (flags & 1) == 1;
  _offset = buffer->read_uint32_be(5);
  if (_offset != Header::MIN_LENGTH) {
    return HeaderValue(true);
  }

  HeaderValue retValue;
  retValue.signature = _signature;
  retValue.version = _version;
  retValue.hasAudio = _hasAudio;
  retValue.hasVideo = _hasVideo;
  retValue.offset = _offset;
  retValue.buffer = make_shared<Buffer>(buffer->slice(9));

  return retValue;
}