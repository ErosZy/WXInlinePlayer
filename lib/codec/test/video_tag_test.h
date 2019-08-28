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
