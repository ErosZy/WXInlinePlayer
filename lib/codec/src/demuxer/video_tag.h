#ifndef CODEC_VIDEO_TAG_H
#define CODEC_VIDEO_TAG_H

#include <stdint.h>
#include <memory>
#include "stream/buffer.h"

using namespace std;

struct VideoTagValue {
    explicit VideoTagValue(bool i = true) : isSupported(i) {};
    bool isSupported;
    uint32_t frameType;
    uint32_t codecId;
    uint32_t AVCPacketType;
    uint32_t compositionTime;
    shared_ptr<Buffer> buffer;
};

class VideoTag {
public:
    static const uint32_t MIN_LENGTH = 0;
    static const uint32_t TYPE = 9;

    VideoTag() : _frameType(0x01), _codecId(0x01), _AVCPacketType(0x01), _compositionTime(0x00) {};

    VideoTagValue decode(const shared_ptr<Buffer> &buffer, uint32_t size);

private:
    uint32_t _frameType;
    uint32_t _codecId;
    uint32_t _AVCPacketType;
    uint32_t _compositionTime;
};

#endif //CODEC_VIDEO_TAG_H
