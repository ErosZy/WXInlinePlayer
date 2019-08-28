#include "audio_tag.h"

AudioTagValue AudioTag::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  _soundFormat = (uint32_t) ((buffer->read_uint8(0) & 240) >> 4);
  if (_soundFormat != 10) {
    return AudioTagValue(false);
  }

  _soundRate = (uint32_t) ((buffer->read_uint8(0) & 12) >> 2);
  _soundSize = (uint32_t) ((buffer->read_uint8(0) & 2) >> 1);
  _soundType = (uint32_t) (buffer->read_uint8(0) & 1);
  _AACPacketType = buffer->read_uint8(1);

  AudioTagValue value;
  value.soundFormat = _soundFormat;
  value.soundRate = _soundRate;
  value.soundSize = _soundSize;
  value.soundType = _soundType;
  value.AACPacketType = _AACPacketType;
  value.data = make_shared<Buffer>(buffer->slice(2, size));
  value.buffer = make_shared<Buffer>(buffer->slice(size));
  return value;
}
