#ifndef CODEC_DECODER_H
#define CODEC_DECODER_H

#include <memory>
#include "stream/buffer.h"

using namespace std;

class Decoder {
public:
    Decoder() : _buffer(make_shared<Buffer>()) {};

    void decode(shared_ptr<Buffer> buffer, uint32_t size = 0);

private:
    shared_ptr<Buffer> _buffer;
};


#endif //CODEC_DECODER_H
