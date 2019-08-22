#ifndef CODEC_FACTOR_IMPL_H
#define CODEC_FACTOR_IMPL_H

#include "demuxer/header.h"
#include "demuxer/body.h"

class DecoderFactor {
public:
    virtual void recvHeaderValue(HeaderValue &value) {}

    virtual void recvBodyValue(shared_ptr<BodyValue> &values) {}
};

#endif //CODEC_FACTOR_IMPL_H
