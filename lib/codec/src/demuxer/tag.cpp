#include "tag.h"

TagValue Tag::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  _type = buffer->read_uint8(0);
  _size = buffer->read_uint24_be(1);

  uint32_t ts0 = buffer->read_uint24_be(4);
  uint32_t ts1 = buffer->read_uint8(7);
  _timestamp = (ts1 << 24) | ts0;

  _streamId = buffer->read_uint24_be(8) >> 8;
  if (_streamId != 0) {
    return TagValue(true);
  }

  if (buffer->get_length() < Tag::MIN_LENGTH + size) {
    return TagValue(true);
  }

  buffer = make_shared<Buffer>(buffer->slice(Tag::MIN_LENGTH));

  TagValue value;
  switch (_type) {
    case AudioTag::TYPE: {
      AudioTag tag;
      value.type = AudioTag::TYPE;
      value.audioTag = tag.decode(buffer, size);
      break;
    }
    case VideoTag::TYPE: {
      VideoTag tag;
      value.type = VideoTag::TYPE;
      value.videoTag = tag.decode(buffer, size);
      break;
    }
    case DataTag::TYPE: {
      DataTag tag;
      value.type = DataTag::TYPE;
      value.dataTag = tag.decode(buffer, size);
      break;
    }
    default:
      return TagValue(true);
  }

  value.buffer = make_shared<Buffer>(buffer->slice(size));
  return value;
}