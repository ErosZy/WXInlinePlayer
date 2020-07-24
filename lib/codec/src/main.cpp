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

#include "codec/codec.h"

Codec *codec;

extern "C" {
void codecInit() {
  if (codec == nullptr) {
    codec = new Codec();
  }
}

void codecSetBridgeName(char *bridgeName) {
  if (codec != nullptr) {
    codec->setBridgeName(string(bridgeName));
  }
}

void codecSetAudioBuffer(char *buffer) {
  if (codec != nullptr) {
    codec->setAudioBuffer((uint8_t *) buffer);
  }
}

void codecSetVideoBuffer(char *buffer) {
  if (codec != nullptr) {
    codec->setVideoBuffer((uint8_t *) buffer);
  }
}

void codecDecode(uint8_t *bytes, uint32_t length) {
  if (codec != nullptr) {
    codec->decode(bytes, length);
  }
}

int codecTry2Seek(char *buffer, uint32_t length) {
  if (codec != nullptr) {
    return codec->try2seek((uint8_t *) buffer, length);
  }
  return 1;
}

void codecFree() {
  if (codec != nullptr) {
    delete codec;
    codec = nullptr;
  }
}
}

// #include <iostream>
// #include <fstream>
//
// int main() {
//   std::ifstream infile("/Users/zhaoyang/Downloads/music1.flv", std::ifstream::binary);
//   if (!infile.is_open()) {
//     return -1;
//   }
//
//   infile.seekg(0, std::ios::end);
//   size_t length = infile.tellg();
//   infile.seekg(0, std::ios::beg);
//   std::cout << "file size: " << length << std::endl;
//
//   char *bytes = new char[length];
//   infile.read(bytes, length);
//
//   Codec codec;
//   codec.decode((uint8_t *)bytes, length);
//   delete[] bytes;
//   return 0;
// }
