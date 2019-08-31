/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/

#ifndef CODEC_CODEC_H
#define CODEC_CODEC_H

#include <string>
#include "config.h"
#include "factor/codec_factor.h"
#include "demuxer/decoder.h"

#ifdef USE_OPEN_H264
#include "openh264/codec/api/svc/codec_api.h"
#else
#include "tinyh264/tinyh264.h"
#endif

using namespace std;

class Codec {
public:
  Codec() : _decoder(make_shared<Decoder>()), _factor(make_shared<CodecFactor>(this)),
            adtsHeader(make_shared<Buffer>()), sps(make_shared<Buffer>()), pps(make_shared<Buffer>()),
            audioBuffer(nullptr), videoBuffer(nullptr) {
#ifdef USE_OPEN_H264
    SDecodingParam sDecParam = {0};
    sDecParam.uiTargetDqLayer = (uint8_t) -1;
    sDecParam.sVideoProperty.size = sizeof(sDecParam.sVideoProperty);
    sDecParam.eEcActiveIdc = ERROR_CON_SLICE_COPY;
    sDecParam.sVideoProperty.eVideoBsType = VIDEO_BITSTREAM_DEFAULT;

    WelsCreateDecoder(&storage);
    storage->Initialize(&sDecParam);
#else
    storage = h264bsdAlloc();
    h264bsdInit(storage, 0);
#endif
    _decoder->setFactor(_factor);
  };

  void decode(uint8_t *bytes, uint32_t byteLen);

  void setBridgeName(string bridge) {
    bridgeName = bridge;
  }

  void setAudioBuffer(uint8_t *ptr) {
    audioBuffer = ptr;
  }

  void setVideoBuffer(uint8_t *ptr) {
    videoBuffer = ptr;
  }

  uint32_t try2seek(uint8_t *bytes, uint32_t byteLen);

  ~Codec() {
#ifdef USE_OPEN_H264
    storage->Uninitialize();
    WelsDestroyDecoder(storage);
    storage = nullptr;
#else
    h264bsdShutdown(storage);
    h264bsdFree(storage);
    storage = nullptr;
#endif
  }

  string bridgeName;
  uint8_t *audioBuffer;
  uint8_t *videoBuffer;
  shared_ptr<Buffer> adtsHeader;
  shared_ptr<Buffer> sps;
  shared_ptr<Buffer> pps;
  int lengthSizeMinusOne;
private:
  shared_ptr<DecoderFactor> _factor;
  shared_ptr<Decoder> _decoder;


#ifdef USE_OPEN_H264
public:
  ISVCDecoder *storage;
#else
  public:
    storage_t *storage;
#endif
};

#endif //CODEC_CODEC_H
