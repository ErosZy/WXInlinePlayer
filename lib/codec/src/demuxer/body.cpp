#include "body.h"

int i = 0;
shared_ptr<BodyValue> Body::decode(shared_ptr<Buffer> &buffer) {
  Tag tag;
  shared_ptr<BodyValue> value = make_shared<BodyValue>();

  for (;;) {
    if (buffer->get_length() < Body::MIN_LENGTH) {
      break;
    }

    uint32_t size = buffer->read_uint32_be(0);
    shared_ptr<Buffer> body = make_shared<Buffer>(buffer->slice(4));
    if (body->get_length() < Tag::MIN_LENGTH) {
      break;
    }

    TagValue retValue = tag.decode(body);
    if (retValue.unvalidate) {
      break;
    }

    buffer = retValue.buffer;
    retValue.buffer = make_shared<Buffer>();
    value->tags->push_back(retValue);
  }

  value->buffer = buffer;
  return value;
}