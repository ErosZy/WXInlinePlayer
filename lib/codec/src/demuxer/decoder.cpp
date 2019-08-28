#include "decoder.h"

void Decoder::decode(shared_ptr<Buffer> &buffer) {
  _buffer = make_shared<Buffer>(*_buffer + *buffer);
  for (;;) {
    switch (_state) {
      case Header::STATE: {
        if (_buffer->get_length() < Header::MIN_LENGTH) {
          return;
        }

        HeaderValue value = _header->decode(_buffer);
        if (value.empty) {
          return;
        }

        _factor->recvHeaderValue(value);
        _buffer = value.buffer;
        _state = Body::STATE;
        break;
      }
      case Body::STATE: {
        if (_buffer->get_length() < Body::MIN_LENGTH) {
          return;
        }

        shared_ptr<BodyValue> value = _body->decode(_buffer);
        if (value->unvalidate) {
          return;
        }

        _factor->recvBodyValue(value);
        _buffer = value->buffer;
      }
      default:
        return;
    }
  }
}
