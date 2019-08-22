#ifndef CODEC_BODY_H
#define CODEC_BODY_H

#include <memory>
#include <string>
#include <stdint.h>
#include <vector>
#include "stream/buffer.h"
#include "tag.h"

using namespace std;

struct BodyValue {
    explicit BodyValue(bool e = false) : unvalidate(e), tags(make_shared<vector<TagValue>>()) {};
    bool unvalidate;
    shared_ptr<vector<TagValue>> tags;
    shared_ptr<Buffer> buffer;
};

class Body {
public:
    static const uint32_t MIN_LENGTH = 4;
    static const uint32_t STATE = 1;

    shared_ptr<BodyValue> decode(shared_ptr<Buffer> &buffer);
};


#endif //CODEC_BODY_H
