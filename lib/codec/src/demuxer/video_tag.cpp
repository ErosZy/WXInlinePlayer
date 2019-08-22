#include "video_tag.h"

VideoTagValue VideoTag::decode(const shared_ptr<Buffer> &buffer, uint32_t size) {
  _frameType = (uint32_t) ((buffer->read_uint8(0) & 240) >> 4);
  _codecId = (uint32_t) (buffer->read_uint8(0) & 15);
  if (_codecId != 7) {
    return VideoTagValue(false);
  }

  _AVCPacketType = buffer->read_uint8(1);
  _compositionTime = (uint32_t) (buffer->read_int32_be(2) >> 8);

  VideoTagValue value;
  value.frameType = _frameType;
  value.codecId = _codecId;
  value.AVCPacketType = _AVCPacketType;
  value.compositionTime = _compositionTime;
  value.data = make_shared<Buffer>(buffer->slice(5, size));
  value.buffer = make_shared<Buffer>(buffer->slice(size));
  return value;
}