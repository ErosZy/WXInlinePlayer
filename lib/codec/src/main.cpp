#include <iostream>
#include "codec/codec.h"

int main() {
  Codec codec;
  shared_ptr<Buffer> buffer = make_shared<Buffer>();
  codec.decode(buffer);
  return 0;
}