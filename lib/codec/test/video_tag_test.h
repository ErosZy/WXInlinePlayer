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

#ifndef CODEC_VIDEO_TAG_TEST_H
#define CODEC_VIDEO_TAG_TEST_H

#include <iostream>
#include <stdint.h>
#include "vassert.h"
#include "stream/buffer.h"
#include "demuxer/video_tag.h"

void test_video_tag() {
  cout << "\033[33m " << "video_tag: \033[0m" << endl;
  uint8_t ptr[47] = {0x17, 0x00, 0x00, 0x00, 0x00, 0x01, 0x4d, 0x40, 0x1f, 0xff, 0xe1, 0x00, 0x1b, 0x67, 0x4d, 0x40, 0x1f,
                   0xe8, 0x80, 0x28, 0x02, 0xdd, 0x80, 0xb5, 0x01, 0x01, 0x01, 0x40, 0x00, 0x00, 0xfa, 0x40, 0x00, 0x2e,
                   0xe0, 0x03, 0xc6, 0x0c, 0x44, 0x80, 0x01, 0x00, 0x04, 0x68, 0xeb, 0xaf, 0x20};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 47);
  VideoTag tag;
  VideoTagValue value = tag.decode(b, 47);
  VASSERT(value.isSupported, "");
  VASSERT(value.compositionTime == 0, "");
  VASSERT(value.frameType == 1, "");
  VASSERT(value.codecId == 7, "");
  VASSERT(value.AVCPacketType == 0, "");
  VASSERT(value.data->get_length() == 42, "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "VideoTag pass");
}

#endif //CODEC_VIDEO_TAG_TEST_H
