#ifndef CODEC_HEADER_TEST_H
#define CODEC_HEADER_TEST_H

#include <iostream>
#include <stdint.h>
#include "vassert.h"
#include "stream/buffer.h"
#include "demuxer/header.h"

void test_header() {
  cout << "\033[33m " << "header: \033[0m" << endl;
  uint8_t ptr[] = {0x46, 0x4c, 0x56, 0x01, 0x05, 0x00, 0x00, 0x00, 0x09};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 9);
  Header header;
  HeaderValue value = header.decode(b);
  VASSERT(!value.empty, "");
  VASSERT(value.version == 1, "");
  VASSERT(value.hasAudio, "");
  VASSERT(value.hasVideo, "");
  VASSERT(value.offset == 9, "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "Header pass");
}

#endif //CODEC_HEADER_TEST_H
