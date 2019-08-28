#ifndef CODEC_DECODER_H
#define CODEC_DECODER_H

#include <memory>
#include "factor/factor_impl.h"
#include "stream/buffer.h"
#include "header.h"
#include "body.h"

using namespace std;

class Decoder {
public:
    Decoder() : _state(0), _buffer(make_shared<Buffer>()), _header(make_shared<Header>()),
                _body(make_shared<Body>()) {};

    void setFactor(shared_ptr<DecoderFactor> &factor) {
      _factor = factor;
    }

    void decode(shared_ptr<Buffer> &buffer);

private:
    uint32_t _state;
    shared_ptr<DecoderFactor> _factor;
    shared_ptr<Buffer> _buffer;
    shared_ptr<Header> _header;
    shared_ptr<Body> _body;
};


#endif //CODEC_DECODER_H
