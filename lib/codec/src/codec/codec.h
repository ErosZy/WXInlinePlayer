#ifndef CODEC_CODEC_H
#define CODEC_CODEC_H

#include <string>
#include "factor/codec_factor.h"
#include "demuxer/decoder.h"
#include "h264/tinyh264.h"

using namespace std;

class Codec {
public:
    Codec() : _decoder(make_shared<Decoder>()), _factor(make_shared<CodecFactor>(this)),
              adtsHeader(make_shared<Buffer>()), sps(make_shared<Buffer>()), pps(make_shared<Buffer>()),
              audioBuffer(nullptr), videoBuffer(nullptr) {
      storage = h264bsdAlloc();
      h264bsdInit(storage, 0);
      _decoder->setFactor(_factor);
    };

    void decode(uint8_t *bytes, uint32_t byteLen);

    void setBridgeName(string bridge) {
      bridgeName = bridge;
    }

    void setAudioBuffer(uint8_t *ptr) {
      audioBuffer = ptr;
    }

    void setVideoBuffer(uint8_t *ptr) {
      videoBuffer = ptr;
    }

    uint32_t try2seek(uint8_t *bytes, uint32_t byteLen);

    ~Codec() {
      h264bsdShutdown(storage);
      h264bsdFree(storage);
      storage = nullptr;
    }

    storage_t *storage;
    string bridgeName;
    uint8_t *audioBuffer;
    uint8_t *videoBuffer;
    shared_ptr<Buffer> adtsHeader;
    shared_ptr<Buffer> sps;
    shared_ptr<Buffer> pps;
    int lengthSizeMinusOne;
private:
    shared_ptr<Decoder> _decoder;
    shared_ptr<DecoderFactor> _factor;
};

#endif //CODEC_CODEC_H
