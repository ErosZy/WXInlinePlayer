#ifndef CODEC_TAG_H
#define CODEC_TAG_H

#include <stdint.h>
#include <memory>
#include "stream/buffer.h"
#include "audio_tag.h"
#include "video_tag.h"
#include "data_tag.h"

struct TagValue {
    explicit TagValue(bool e = false) : unvalidate(e) {};
    bool unvalidate;
    uint32_t type;
    uint32_t timestamp;
    AudioTagValue audioTag;
    VideoTagValue videoTag;
    DataTagValue dataTag;
    shared_ptr<Buffer> buffer;
};

class Tag {
public:
    static const uint32_t MIN_LENGTH = 11;

    TagValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0);

private:
    uint32_t _type;
    uint32_t _size;
    uint32_t _timestamp;
    uint32_t _streamId;
    shared_ptr<TagValue> _data;
};

#endif