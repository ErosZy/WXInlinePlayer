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

#include "tag.h"

TagValue Tag::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  _type = buffer->read_uint8(0);
  _size = buffer->read_uint24_be(1);

  uint32_t ts0 = buffer->read_uint24_be(4);
  uint32_t ts1 = buffer->read_uint8(7);
  _timestamp = (ts1 << 24) | ts0;

  _streamId = buffer->read_uint24_be(8) >> 8;
  if (_streamId != 0) {
    return TagValue(true);
  }

  if (buffer->get_length() < Tag::MIN_LENGTH + _size) {
    return TagValue(true);
  }

  buffer = make_shared<Buffer>(buffer->slice(Tag::MIN_LENGTH));

  TagValue value;
  switch (_type) {
    case AudioTag::TYPE: {
      AudioTag tag;
      value.type = AudioTag::TYPE;
      value.audioTag = tag.decode(buffer, _size);
      value.audioTag.buffer = make_shared<Buffer>();
      break;
    }
    case VideoTag::TYPE: {
      VideoTag tag;
      value.type = VideoTag::TYPE;
      value.videoTag = tag.decode(buffer, _size);
      value.videoTag.buffer = make_shared<Buffer>();
      break;
    }
    case DataTag::TYPE: {
      DataTag tag;
      value.type = DataTag::TYPE;
      value.dataTag = tag.decode(buffer, _size);
      value.dataTag.buffer = make_shared<Buffer>();
      break;
    }
    default:
      return TagValue(true);
  }

  value.timestamp = _timestamp;
  value.buffer = make_shared<Buffer>(buffer->slice(_size));
  return value;
}