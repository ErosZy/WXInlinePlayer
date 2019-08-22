#ifndef CODEC_CODEC_FACTOR_H
#define CODEC_CODEC_FACTOR_H

#include <string>
#include "factor_impl.h"
#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

using namespace std;

class Codec;

class CodecFactor : public DecoderFactor {
public:
    explicit CodecFactor(Codec *codec = nullptr) : _codec(codec) {
      uint8_t ptr[] = {0x00, 0x00, 0x00, 0x01};
      _mask = make_shared<Buffer>(ptr, 4);
    };

    void recvHeaderValue(HeaderValue &value) override;

    void recvBodyValue(shared_ptr<BodyValue> &values) override;

private:
    void _handleDataTag(DataTagValue &tag) const;

    void _handleAudioTag(AudioTagValue &tag, uint32_t timestamp) const;

    void _handleVideoTag(VideoTagValue &tag, uint32_t timestamp) const;

    Codec *_codec;
    shared_ptr<Buffer> _mask;
};


#endif //CODEC_CODEC_FACTOR_H
