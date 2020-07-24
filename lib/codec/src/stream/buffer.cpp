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

#include <cassert>
#include <cmath>
#include <cfloat>
#include <string.h>
#include "buffer.h"

using namespace stream;

inline enum Endianness get_endianness() {
  const union {
      uint8_t u8[2];
      uint16_t u16;
  } u = {{1, 0}};
  return u.u16 == 1 ? kLittleEndian : kBigEndian;
}

static inline void swizzle(int8_t *start, uint32_t len) {
  int8_t *end = start + len - 1;
  while (start < end) {
    int8_t tmp = *start;
    *start++ = *end;
    *end-- = tmp;
  }
}

template<typename T, enum Endianness endianness>
inline void write_float_generic(Buffer &buffer, T value, uint32_t offset) {
  value_type *ptr = buffer.get_buf_ptr() + offset;
  size_t memcpy_num = sizeof(T);

  union {
      T val;
      int8_t bytes[sizeof(T)];
  } na = {value};

  if (endianness != get_endianness()) {
    swizzle(na.bytes, sizeof(na.bytes));
  }

  ::memcpy(ptr, na.bytes, memcpy_num);
};

void Buffer::fill(value_type *p, uint32_t len) {
  this->resize(len);
  std::copy(p, p + len, this->get_buf_ptr());
}

void Buffer::output() {}

Buffer Buffer::operator+(Buffer &op) {
  Buffer ret;
  ret.resize(this->_length + op._length);

  std::copy(this->begin(),
            this->end(),
            ret.begin());

  std::copy(op.begin(),
            op.end(),
            ret.begin() + this->_length);

  return ret;
}

Buffer Buffer::slice(uint32_t start, uint32_t end) {
  Buffer ret;

  ret._shared_buf = this->_shared_buf;
  ret._offset = _offset + start;
  ret._length = (end == LIMIT_SIZE) ? _length - start : end - start;

  return ret;
}

int Buffer::normalize_compare_val(int val, size_t a_length, size_t b_length) {
  if (val == 0) {
    if (a_length > b_length)
      return 1;
    else if (a_length < b_length)
      return -1;
  } else {
    if (val > 0)
      return 1;
    else
      return -1;
  }
  return val;
}

int8_t Buffer::compare(Buffer &target) {
  size_t cmp_length = this->_length > target._length ? target._length : this->_length;
  int cmp_val = cmp_length > 0 ? memcmp(this->get_buf_ptr(), target.get_buf_ptr(), cmp_length) : 0;
  return int8_t(Buffer::normalize_compare_val(cmp_val, this->get_length(), target.get_length()));
}

uint32_t Buffer::copy(Buffer &target, uint32_t targetStart, int32_t sourceStart, int32_t sourceEnd) {
  assert(sourceEnd >= -1);
  assert(sourceEnd == -1 || sourceEnd > sourceStart);
  assert(targetStart < target.get_length());
  sourceEnd = sourceEnd == -1 ? int32_t(this->get_length()) : sourceEnd;

  uint32_t target_ex_len = target.get_length() - targetStart;
  uint32_t source_ex_len = sourceEnd - sourceStart;
  uint32_t copy_len = target_ex_len > source_ex_len ? source_ex_len : target_ex_len;

  memcpy(target.get_buf_ptr() + targetStart, this->get_buf_ptr() + sourceStart, copy_len);
  return copy_len;
}

bool Buffer::equals(Buffer &buffer) {
  if (this->get_length() != buffer.get_length()) {
    return false;
  }
  return memcmp(this->get_buf_ptr(), buffer.get_buf_ptr(), this->get_length()) == 0;
}

double Buffer::read_double_be(uint32_t offset) {
  assert(offset + 8 <= this->_length);
  uint32_t x1 = this->read_uint32_be(offset + 0);
  uint32_t x0 = this->read_uint32_be(offset + 4);
  return this->to_double(x0, x1);
}

double Buffer::read_double_le(uint32_t offset) {
  assert(offset + 8 <= this->_length);
  uint32_t x0 = this->read_uint32_le(offset + 0);
  uint32_t x1 = this->read_uint32_le(offset + 4);
  return this->to_double(x0, x1);
}

float Buffer::read_float_be(uint32_t offset) {
  assert(offset + 4 <= this->_length);
  return this->to_float(this->read_uint32_be(offset));
}

float Buffer::read_float_le(uint32_t offset) {
  assert(offset + 4 <= this->_length);
  return this->to_float(this->read_uint32_le(offset));
}

int8_t Buffer::read_int8(uint32_t offset) {
  assert(offset <= this->_length);
  auto data = this->get_buf_ptr();
  uint8_t val = data[offset];
  return int8_t(!(val & 0x80) ? val : (0xff - val + 1) * -1);
}

int16_t Buffer::read_int16_be(uint32_t offset) {
  assert(offset + 2 <= this->_length);
  auto data = this->get_buf_ptr();
  int16_t val = data[offset + 1] | (data[offset] << 8);
  return int16_t((val & 0x8000) ? val | 0xFFFF0000 : val);
}

int16_t Buffer::read_int16_le(uint32_t offset) {
  assert(offset + 2 <= this->_length);
  auto data = this->get_buf_ptr();
  int16_t val = data[offset] | (data[offset + 1] << 8);
  return int16_t((val & 0x8000) ? val | 0xFFFF0000 : val);
}

uint32_t Buffer::read_uint24_be(uint32_t offset) {
  uint8_t b0 = this->read_uint8(offset + 0);
  uint8_t b1 = this->read_uint8(offset + 1);
  uint8_t b2 = this->read_uint8(offset + 2);
  return (b0 << 16) | (b1 << 8) | b2;
}

int32_t Buffer::read_int32_be(uint32_t offset) {
  assert(offset + 4 <= this->_length);
  auto data = this->get_buf_ptr();
  return (data[offset] << 24) |
         (data[offset + 1] << 16) |
         (data[offset + 2] << 8) |
         (data[offset + 3]);
}

int32_t Buffer::read_int32_le(uint32_t offset) {
  assert(offset + 4 <= this->_length);
  auto data = this->get_buf_ptr();
  return data[offset] |
         (data[offset + 1] << 8) |
         (data[offset + 2] << 16) |
         (data[offset + 3] << 24);
}

uint8_t Buffer::read_uint8(uint32_t offset) {
  assert(offset <= this->_length);
  auto data = this->get_buf_ptr();
  return data[offset];
}

uint16_t Buffer::read_uint16_be(uint32_t offset) {
  assert(offset + 2 <= this->_length);
  auto data = this->get_buf_ptr();
  return (data[offset] << 8) | data[offset + 1];
}

uint16_t Buffer::read_uint16_le(uint32_t offset) {
  assert(offset + 2 <= this->_length);
  auto data = this->get_buf_ptr();
  return data[offset] | (data[offset + 1] << 8);
}

uint32_t Buffer::read_uint32_be(uint32_t offset) {
  assert(offset + 4 <= this->_length);
  auto data = this->get_buf_ptr();
  return uint32_t(data[offset] * 0x1000000 |
                  data[offset + 1] << 16 |
                  data[offset + 2] << 8 |
                  data[offset + 3]);
}

uint32_t Buffer::read_uint32_le(uint32_t offset) {
  assert(offset + 4 <= this->_length);
  auto data = this->get_buf_ptr();
  return uint32_t(data[offset] |
                  data[offset + 1] << 8 |
                  data[offset + 2] << 16 |
                  data[offset + 3] * 0x1000000);
}

void Buffer::write_double_be(double value, uint32_t offset) {
  assert(offset + 8 <= this->_length);
  check_copy_on_write();
  write_float_generic<double, kBigEndian>(*this, value, offset);
}

void Buffer::write_double_le(double value, uint32_t offset) {
  assert(offset + 8 <= this->_length);
  check_copy_on_write();
  write_float_generic<double, kLittleEndian>(*this, value, offset);
}

void Buffer::write_float_be(float value, uint32_t offset) {
  assert(offset + 4 <= this->_length);
  check_copy_on_write();
  write_float_generic<float, kBigEndian>(*this, value, offset);
}

void Buffer::write_float_le(float value, uint32_t offset) {
  assert(offset + 4 <= this->_length);
  check_copy_on_write();
  write_float_generic<float, kLittleEndian>(*this, value, offset);
}

void Buffer::write_int8(int8_t value, uint32_t offset) {
  check_copy_on_write();
  this->write_uint8(uint8_t(value), offset);
}

void Buffer::write_int16_be(int16_t value, uint32_t offset) {
  check_copy_on_write();
  this->write_uint16_be(uint16_t(value), offset);
}

void Buffer::write_int16_le(int16_t value, uint32_t offset) {
  check_copy_on_write();
  this->write_uint16_le(uint16_t(value), offset);
}

void Buffer::write_int32_be(int32_t value, uint32_t offset) {
  check_copy_on_write();
  this->write_uint32_be(uint32_t(value), offset);
}

void Buffer::write_int32_le(int32_t value, uint32_t offset) {
  check_copy_on_write();
  this->write_uint32_le(uint32_t(value), offset);
}

void Buffer::write_uint8(uint8_t value, uint32_t offset) {
  assert(offset <= this->_length);
  check_copy_on_write();
  auto data = this->get_buf_ptr();
  data[offset] = value;
}

void Buffer::write_uint16_be(uint16_t value, uint32_t offset) {
  assert(offset + 2 <= this->_length);
  check_copy_on_write();
  auto data = this->get_buf_ptr();
  data[offset] = uint8_t((value >> 8) & 0x00ff);
  data[offset + 1] = uint8_t(value & 0x00ff);
}

void Buffer::write_uint16_le(uint16_t value, uint32_t offset) {
  assert(offset + 2 <= this->_length);
  check_copy_on_write();
  auto data = this->get_buf_ptr();
  data[offset] = uint8_t(value & 0xff);
  data[offset + 1] = uint8_t((value >> 8) & 0x00ff);
}

void Buffer::write_uint32_be(uint32_t value, uint32_t offset) {
  assert(offset + 4 <= this->_length);
  check_copy_on_write();
  auto data = this->get_buf_ptr();
  data[offset] = uint8_t((uint32_t(value) >> 24) & 0x000000ff);
  data[offset + 1] = uint8_t((uint32_t(value) >> 16) & 0x000000ff);
  data[offset + 2] = uint8_t((uint32_t(value) >> 8) & 0x000000ff);
  data[offset + 3] = uint8_t(uint32_t(value) & 0x000000ff);
}

void Buffer::write_uint32_le(uint32_t value, uint32_t offset) {
  assert(offset + 4 <= this->_length);
  check_copy_on_write();
  auto data = this->get_buf_ptr();
  data[offset] = uint8_t(uint32_t(value) & 0x000000ff);
  data[offset + 1] = uint8_t((uint32_t(value) >> 8) & 0x000000ff);
  data[offset + 2] = uint8_t((uint32_t(value) >> 16) & 0x000000ff);
  data[offset + 3] = uint8_t((uint32_t(value) >> 24) & 0x000000ff);
}

double Buffer::to_double(uint32_t x0, uint32_t x1) {
  uint64_t frac = uint64_t(x0) + 0x100000000 * (uint64_t(x1) & 0xfffff);
  uint64_t expt = (uint64_t(x1) >> 20) & 2047;
  int64_t sign = (x1 >> 31) & 1 ? -1 : 1;
  if (expt == 0) {
    if (frac == 0) return sign * 0;
    return sign * frac * pow(2, -1074);
  } else if (expt == 2047) {
    if (frac == 0) return DBL_MAX;
    return DBL_MIN;
  }
  return sign * pow(2, (int64_t)(expt - 1023)) * (1 + frac * pow(2, -52));
}

float Buffer::to_float(uint32_t x) {
  uint32_t frac = x & 0x7fffff;
  uint32_t expt = (x >> 23) & 0x007fffff & 255;
  int32_t sign = x >> 31 & 1 ? -1 : 1;
  if (expt == 0) {
    if (frac == 0) return sign * 0;
    return sign * frac * powf(2, -149);
  } else if (expt == 255) {
    if (frac == 0) return FLT_MAX;
    return FLT_MIN;
  }
  return sign * powf(2, expt - 127) * (1 + frac * powf(2, -23));
}
