#ifndef CODEC_AUDIO_TAG_H
#define CODEC_AUDIO_TAG_H

#include <stdint.h>
#include <memory>
#include "stream/buffer.h"

using namespace std;

struct AudioTagValue {
    explicit AudioTagValue(bool i = true) : isSupported(i) {};
    bool isSupported;
    uint32_t soundFormat;
    uint32_t soundRate;
    uint32_t soundSize;
    uint32_t soundType;
    uint32_t AACPacketType;
    shared_ptr<Buffer> data;
    shared_ptr<Buffer> buffer;
};

class AudioTag {
public:
    static const uint32_t MIN_LENGTH = 0;
    static const uint32_t TYPE = 8;

    AudioTag() : _soundFormat(0x01), _soundRate(0x01), _soundSize(0x01), _soundType(0x01), _AACPacketType(0x01) {}

    AudioTagValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0);

private:
    uint32_t _soundFormat;
    uint32_t _soundRate;
    uint32_t _soundSize;
    uint32_t _soundType;
    uint32_t _AACPacketType;
};

#endif //CODEC_AUDIO_TAG_H
