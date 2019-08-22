#include "codec_factor.h"
#include "codec/codec.h"

void CodecFactor::recvHeaderValue(HeaderValue &value) {
#ifdef __EMSCRIPTEN__
  EM_ASM({
    var bridge = (window || self)[UTF8ToString($0)];
    if(bridge && typeof bridge["onHeader"] == "function"){
      bridge["onHeader"]({
        "hasAudio": $1,
        "hasVideo": $2,
      });
    }
  }, _codec->bridgeName.c_str(), value.hasAudio, value.hasVideo);
#endif
}

void CodecFactor::recvBodyValue(shared_ptr<BodyValue> &values) {
  for (uint32_t i = 0; i < values->tags->size(); i++) {
    TagValue value = values->tags->at(i);
    if (value.unvalidate) {
      break;
    }
    if (value.type == DataTag::TYPE) {
      _handleDataTag(value.dataTag);
    } else if (value.type == AudioTag::TYPE) {
      _handleAudioTag(value.audioTag, value.timestamp);
    } else if (value.type == VideoTag::TYPE) {
      _handleVideoTag(value.videoTag, value.timestamp);
    }
  }
}

void CodecFactor::_handleDataTag(DataTagValue &tag) const {
  for (uint32_t i = 0; i < tag.objects->size(); i++) {
    string jsonstr = tag.objects->at(0).to_json();
#ifdef __EMSCRIPTEN__
    EM_ASM({
      var bridge = (window || self)[UTF8ToString($0)];
      var json = JSON.parse(UTF8ToString($1));
      if(bridge && typeof bridge["onMediaInfo"] == 'function'){
        bridge["onMediaInfo"](json);
      }
    }, _codec->bridgeName.c_str(), jsonstr.c_str());
#endif
  }
}

void CodecFactor::_handleAudioTag(AudioTagValue &tag, uint32_t timestamp) const {
  if (tag.AACPacketType == 0) {
    shared_ptr<Buffer> audioSpecificConfig = tag.data;
    int audioObjectType = ((*audioSpecificConfig)[0] & 0xf8) >> 3;
    int samplingFrequencyIndex = (((*audioSpecificConfig)[0] & 0x7) << 1) | ((*audioSpecificConfig)[1] >> 7);
    int channelConfig = ((*audioSpecificConfig)[1] >> 3) & 0x0f;
    int frameLengthFlag = ((*audioSpecificConfig)[1] >> 2) & 0x01;
    int dependsOnCoreCoder = ((*audioSpecificConfig)[1] >> 1) & 0x01;
    int extensionFlag = (*audioSpecificConfig)[1] & 0x01;

    uint8_t adts[7] = {
            0xff,
            0xf0 | (0 << 3) | (0 << 1) | 1,
            (uint8_t) (((audioObjectType - 1) << 6) | ((samplingFrequencyIndex & 0x0f) << 2) | (0 << 1) | ((channelConfig & 0x04) >> 2)),
            (uint8_t) (((channelConfig & 0x03) << 6) | (0 << 5) | (0 << 4) | (0 << 3) | (0 << 2) | ((7 & 0x1800) >> 11)),
            (uint8_t) ((7 & 0x7f8) >> 3),
            (uint8_t) (((7 & 0x7) << 5) | 0x1f),
            0xfc,
    };
    _codec->adtsHeader = make_shared<Buffer>(adts, 7);
  } else if (tag.AACPacketType == 1) {
    shared_ptr<Buffer> adtsHeader = make_shared<Buffer>();
    adtsHeader = make_shared<Buffer>(*adtsHeader + *_codec->adtsHeader);
    shared_ptr<Buffer> adtsBody = tag.data;
    uint32_t adtsLen = adtsBody->get_length() + 7;
    adtsHeader->write_uint8(adtsHeader->read_uint8(3) | ((adtsLen & 0x1800) >> 11), 3);
    adtsHeader->write_uint8((adtsLen & 0x7f8) >> 3, 4);
    adtsHeader->write_uint8((((adtsLen & 0x7) << 5) | 0x1f), 5);
    adtsHeader->write_uint8(0xfc, 6);
    adtsBody = make_shared<Buffer>(*adtsHeader + *adtsBody);
#ifdef __EMSCRIPTEN__
    EM_ASM({
      var bridge = (window || self)[UTF8ToString($0)];
      if(bridge && typeof bridge["onAudioDataSize"] == "function"){
        bridge["onAudioDataSize"]({
          "size": $1,
        });
      }
    }, _codec->bridgeName.c_str(), adtsBody->get_length());

    if(_codec->audioBuffer != nullptr){
      memcpy(_codec->audioBuffer, adtsBody->get_buf_ptr(), adtsBody->get_length());
      EM_ASM({
        var bridge = (window || self)[UTF8ToString($0)];
        if(bridge && typeof bridge["onAudioData"] == "function"){
          bridge["onAudioData"]({
            "timestamp": $1,
          });
        }
      }, _codec->bridgeName.c_str(), timestamp);
    }
#endif
  }
}

void CodecFactor::_handleVideoTag(VideoTagValue &tag, uint32_t timestamp) const {
  uint32_t width = 0;
  uint32_t height = 0;
  uint8_t *picPtr = nullptr;

  if (tag.AVCPacketType == 0) {
    shared_ptr<Buffer> unit = tag.data;
    uint8_t configurationVersion = unit->read_uint8(0);
    uint8_t AVCProfileIndication = unit->read_uint8(1);
    uint8_t profileCompatibility = unit->read_uint8(2);
    uint8_t AVCLevelIndication = unit->read_uint8(3);
    _codec->lengthSizeMinusOne = (unit->read_uint8(4) & 3) + 1;

    int numOfSequenceParameterSets = unit->read_uint8(5) & 0x1f;
    int sequenceParameterSetLength = unit->read_uint16_be(6);
    _codec->sps = make_shared<Buffer>(unit->slice(8, 8 + (uint32_t) sequenceParameterSetLength));
    _codec->sps = make_shared<Buffer>(*_mask + *_codec->sps);
    h264bsdDecode(_codec->storage, _codec->sps->get_buf_ptr(), _codec->sps->get_length(), &picPtr, &width, &height);

    int numOfPictureParameterSets = unit->read_uint8(8 + (uint32_t) sequenceParameterSetLength);
    int pictureParameterSetLength = unit->read_uint16_be(8 + (uint32_t) sequenceParameterSetLength + 1);
    _codec->pps = make_shared<Buffer>(unit->slice(
            8 + (uint32_t) sequenceParameterSetLength + 3,
            8 + (uint32_t) sequenceParameterSetLength + 3 + pictureParameterSetLength
    ));
    h264bsdDecode(_codec->storage, _codec->pps->get_buf_ptr(), _codec->pps->get_length(), &picPtr, &width, &height);
  } else if (tag.AVCPacketType == 1) {
    uint32_t size = tag.data->get_length();
    shared_ptr<Buffer> unit = tag.data;
    shared_ptr<Buffer> nalus = make_shared<Buffer>();
    while (size > 0) {
      int naluLen = 0;
      for (uint32_t i = 0; i < _codec->lengthSizeMinusOne; i++) {
        naluLen |= unit->read_uint8(i) << ((_codec->lengthSizeMinusOne - 1 - i) * 8);
      }
      shared_ptr<Buffer> nalu = make_shared<Buffer>(unit->slice(
              (uint32_t) _codec->lengthSizeMinusOne,
              (uint32_t) _codec->lengthSizeMinusOne + naluLen
      ));
      nalus = make_shared<Buffer>(*nalus + *_mask + *nalu);
      unit = make_shared<Buffer>(unit->slice((uint32_t) _codec->lengthSizeMinusOne + naluLen));
      size -= _codec->lengthSizeMinusOne + naluLen;
    }

    uint32_t retCode = h264bsdDecode(_codec->storage, nalus->get_buf_ptr(), nalus->get_length(), &picPtr, &width,
                                     &height);
    if (retCode == H264BSD_PIC_RDY) {
      uint32_t totalSize = (width * height) * 3 / 2;
#ifdef __EMSCRIPTEN__
      EM_ASM({
        var bridge = (window || self)[UTF8ToString($0)];
        if(bridge && typeof bridge["onVideoDataSize"] == "function"){
          bridge["onVideoDataSize"]({
            "size": $1,
          });
        }
      }, _codec->bridgeName.c_str(), totalSize);

      if(_codec->videoBuffer != nullptr){
        memcpy(_codec->videoBuffer, picPtr, totalSize);
        EM_ASM({
          var bridge = (window || self)[UTF8ToString($0)];
          if(bridge && typeof bridge["onVideoData"] == "function"){
            bridge["onVideoData"]({
              "timestamp": $1,
              "width": $2,
              "height": $3,
            });
          }
        }, _codec->bridgeName.c_str(), timestamp, width, height);
      }
#endif
    }
  } else if (tag.AVCPacketType == 2) {
#ifdef __EMSCRIPTEN__
    EM_ASM({
      var bridge = (window || self)[UTF8ToString($0)];
      if(bridge && typeof bridge["onComplete"] == "function"){
        bridge["onComplete"]();
      }
    }, _codec->bridgeName.c_str());
#endif
  }
}