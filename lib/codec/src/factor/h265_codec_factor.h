#ifndef CODEC_H265_CODEC_FACTOR_HPP
#define CODEC_H265_CODEC_FACTOR_HPP

#include "codec_factor.h"
//#include "helper/sdl.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

class H265CodecFactor : public CodecFactor {
public:
  explicit H265CodecFactor(Codec *codec = nullptr) : CodecFactor(codec), _pts(0) {};

protected:
  void _handleVideoTag(VideoTagValue &tag, uint32_t timestamp) override;

private:
  uint32_t _pts;
};


#endif //CODEC_H265_CODEC_FACTOR_HPP
