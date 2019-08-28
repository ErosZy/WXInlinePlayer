#ifndef CODEC_HEADER_H
#define CODEC_HEADER_H

#include <memory.h>
#include <memory>
#include <stdint.h>
#include <string>
#include "stream/buffer.h"

using namespace std;

struct HeaderValue {
    explicit HeaderValue(bool e = false) : empty(e) {};

    bool empty;
    Buffer signature;
    uint32_t version;
    bool hasAudio;
    bool hasVideo;
    uint32_t offset;
    shared_ptr<Buffer> buffer;
};

class Header {
public:
    static const uint8_t FLV_CHARS[];
    static const uint32_t MIN_LENGTH = 9;
    static const uint32_t STATE = 0;

    Header() : _signature(Buffer()), _version(0x01), _hasAudio(false), _hasVideo(false), _offset(0) {};

    HeaderValue decode(shared_ptr<Buffer> &buffer);

private:
    Buffer _signature;
    uint32_t _version;
    bool _hasAudio;
    bool _hasVideo;
    uint32_t _offset;
};

#endif //CODEC_HEADER_H
