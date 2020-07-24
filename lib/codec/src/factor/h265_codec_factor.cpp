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

#include "h265_codec_factor.h"
#include "codec/codec.h"

//SDL_YUV_Display sdlWin;
//bool sdl_active = false;
//
//uint8_t *convert_to_8bit(const uint8_t *data, int width, int height,
//                         int pixelsPerLine, int bit_depth) {
//  const uint16_t *data16 = (const uint16_t *) data;
//  uint8_t *out = new uint8_t[pixelsPerLine * height];
//
//  for (int y = 0; y < height; y++) {
//    for (int x = 0; x < width; x++) {
//      out[y * pixelsPerLine + x] = *(data16 + y * pixelsPerLine + x) >> (bit_depth - 8);
//    }
//  }
//
//  return out;
//}
//
//bool display_sdl(const struct de265_image *img) {
//  int width = de265_get_image_width(img, 0);
//  int height = de265_get_image_height(img, 0);
//
//  int chroma_width = de265_get_image_width(img, 1);
//  int chroma_height = de265_get_image_height(img, 1);
//
//  de265_chroma chroma = de265_get_chroma_format(img);
//
//  if (!sdl_active) {
//    sdl_active = true;
//    enum SDL_YUV_Display::SDL_Chroma sdlChroma;
//    switch (chroma) {
//      case de265_chroma_420:
//        sdlChroma = SDL_YUV_Display::SDL_CHROMA_420;
//        break;
//      case de265_chroma_422:
//        sdlChroma = SDL_YUV_Display::SDL_CHROMA_422;
//        break;
//      case de265_chroma_444:
//        sdlChroma = SDL_YUV_Display::SDL_CHROMA_444;
//        break;
//      case de265_chroma_mono:
//        sdlChroma = SDL_YUV_Display::SDL_CHROMA_MONO;
//        break;
//    }
//
//    sdlWin.init(width, height, sdlChroma);
//  }
//
//  int stride, chroma_stride;
//  const uint8_t *y = de265_get_image_plane(img, 0, &stride);
//  const uint8_t *cb = de265_get_image_plane(img, 1, &chroma_stride);
//  const uint8_t *cr = de265_get_image_plane(img, 2, NULL);
//
//  int bpp_y = (de265_get_bits_per_pixel(img, 0) + 7) / 8;
//  int bpp_c = (de265_get_bits_per_pixel(img, 1) + 7) / 8;
//  int ppl_y = stride / bpp_y;
//  int ppl_c = chroma_stride / bpp_c;
//
//  uint8_t *y16 = NULL;
//  uint8_t *cb16 = NULL;
//  uint8_t *cr16 = NULL;
//  int bd;
//
//  if ((bd = de265_get_bits_per_pixel(img, 0)) > 8) {
//    y16 = convert_to_8bit(y, width, height, ppl_y, bd);
//    y = y16;
//  }
//
//  if (chroma != de265_chroma_mono) {
//    if ((bd = de265_get_bits_per_pixel(img, 1)) > 8) {
//      cb16 = convert_to_8bit(cb, chroma_width, chroma_height, ppl_c, bd);
//      cb = cb16;
//    }
//    if ((bd = de265_get_bits_per_pixel(img, 2)) > 8) {
//      cr16 = convert_to_8bit(cr, chroma_width, chroma_height, ppl_c, bd);
//      cr = cr16;
//    }
//  }
//
//  sdlWin.display(y, cb, cr, ppl_y, ppl_c);
//
//  delete[] y16;
//  delete[] cb16;
//  delete[] cr16;
//
//  return sdlWin.doQuit();
//}

void H265CodecFactor::_handleVideoTag(VideoTagValue &tag, uint32_t timestamp) {
#ifdef USE_OPEN_H265
  int width = 0;
  int height = 0;
  int stridey = 0;
  int strideu = 0;
  int totalSize = 0;

  if (tag.AVCPacketType == 0) {
    shared_ptr<Buffer> unit = tag.data;
    int naluLengthSize = 1 + (3 & unit->read_uint8(21));
    int decodeConfigNums = unit->read_uint8(22);

    uint32_t index = 23;
    for (uint32_t i = 0; i < decodeConfigNums; i++) {
      int h = 63 & unit->read_uint8(index++);
      int p = unit->read_uint16_be(index);
      index += 2;
      for (int j = 0; j < p; j++) {
        uint16_t _ = unit->read_uint16_be(index);
        index += 2;
        if (h == 32) {
          auto vps = make_shared<Buffer>(unit->slice(index, index + _));
          _codec->vps = make_shared<Buffer>(*_mask + *vps);
          index += _;
          de265_push_data(_codec->storage, _codec->vps->get_buf_ptr(), _codec->vps->get_length(), _pts, nullptr);
          _pts += _codec->vps->get_length();
        } else if (h == 33) {
          auto sps = make_shared<Buffer>(unit->slice(index, index + _));
          _codec->sps = make_shared<Buffer>(*_mask + *sps);
          index += _;
          de265_push_data(_codec->storage, _codec->sps->get_buf_ptr(), _codec->sps->get_length(), _pts, nullptr);
          _pts += _codec->sps->get_length();
        } else if (h == 34) {
          auto pps = make_shared<Buffer>(unit->slice(index, index + _));
          _codec->pps = make_shared<Buffer>(*_mask + *pps);
          index += _;
          de265_push_data(_codec->storage, _codec->pps->get_buf_ptr(), _codec->pps->get_length(), _pts, nullptr);
          _pts += _codec->pps->get_length();
        }
      }
    }

    int more = 0;
    de265_flush_data(_codec->storage);
    do {
      de265_decode(_codec->storage, &more);
    } while (more);
  } else if (tag.AVCPacketType == 1) {
    shared_ptr<Buffer> unit = tag.data;
    uint32_t index = 0;
    while (index < unit->get_length()) {
      uint32_t S = unit->read_uint32_be(index);
      index += 4;
      auto k = make_shared<Buffer>(unit->slice(index, index + S));
      index += S;
      auto nalu = make_shared<Buffer>(*_mask + *k);
      de265_push_data(_codec->storage, nalu->get_buf_ptr(), nalu->get_length(), _pts, nullptr);
      _pts += nalu->get_length();
    }

    int more = 1;
    do {
      de265_error error = de265_decode(_codec->storage, &more);
      if (error != DE265_OK) {
        break;
      }

      const de265_image *img = de265_get_next_picture(_codec->storage);
      if (img != nullptr) {
        width = de265_get_image_width(img, 0);
        height = de265_get_image_height(img, 0);
        const uint8_t *y = de265_get_image_plane(img, 0, &stridey);
        const uint8_t *u = de265_get_image_plane(img, 1, &strideu);
        const uint8_t *v = de265_get_image_plane(img, 2, nullptr);
        totalSize = (height * width) * 3 / 2;

#ifdef __EMSCRIPTEN__
        EM_ASM({
        var isWorker = typeof importScripts == "function";
        var bridge = (isWorker ? self : window)[UTF8ToString($0)];
        if(bridge && typeof bridge["onVideoDataSize"] == "function"){
          bridge["onVideoDataSize"]({
            "size": $1,
          });
        }
      }, _codec->bridgeName.c_str(), totalSize);
#else
//        _codec->videoBuffer = new uint8_t[totalSize]{0};
#endif

        if (_codec->videoBuffer != nullptr) {
          uint32_t startIndex = 0;
          if (stridey == width && strideu == width / 2) {
            memcpy(_codec->videoBuffer, y, width * height);
            startIndex += width * height;
            memcpy(_codec->videoBuffer + startIndex, u, width * height / 4);
            startIndex += width * height / 4;
            memcpy(_codec->videoBuffer + startIndex, v, width * height / 4);
          } else {
            uint32_t iWidth = width;
            uint32_t iHeight = height;
            for (uint32_t i = 0; i < iHeight; i++) {
              memcpy(_codec->videoBuffer + startIndex, y, iWidth);
              y += stridey;
              startIndex += iWidth;
            }

            iWidth = width / 2;
            iHeight = height / 2;
            for (uint32_t i = 0; i < iHeight; i++) {
              memcpy(_codec->videoBuffer + startIndex, u, iWidth);
              u += strideu;
              startIndex += iWidth;
            }

            iWidth = width / 2;
            iHeight = height / 2;
            for (uint32_t i = 0; i < iHeight; i++) {
              memcpy(_codec->videoBuffer + startIndex, v, iWidth);
              v += strideu;
              startIndex += iWidth;
            }
          }
        }

#ifdef __EMSCRIPTEN__
        EM_ASM({
          var isWorker = typeof importScripts == "function";
          var bridge = (isWorker ? self : window)[UTF8ToString($0)];
          if(bridge && typeof bridge["onVideoData"] == "function"){
            bridge["onVideoData"]({
              "timestamp": $1,
              "width": $2,
              "height": $3,
              "stride0": $4,
              "stride1": $5
            });
          }
        }, _codec->bridgeName.c_str(), timestamp, width, height, stridey, strideu);
#else
//        delete[] _codec->videoBuffer;
#endif
//        display_sdl(img);
      }
    } while (more);
  } else {
#ifdef __EMSCRIPTEN__
    EM_ASM({
      var isWorker = typeof importScripts == "function";
      var bridge = (isWorker ? self : window)[UTF8ToString($0)];
      if(bridge && typeof bridge["onComplete"] == "function"){
        bridge["onComplete"]();
      }
    }, _codec->bridgeName.c_str());
#endif
  }
#endif
}
