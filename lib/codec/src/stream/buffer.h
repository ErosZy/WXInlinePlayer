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

#ifndef _STREAM_BUFFER_
#define _STREAM_BUFFER_

#include <memory>
#include <vector>

namespace stream {
    enum Endianness {
        kLittleEndian,
        kBigEndian
    };

    enum {
        LIMIT_SIZE = 0xffffffff
    };

    using value_type = uint8_t;

    class SharedBuffer {
    public :
        SharedBuffer() {
          this->_pbuf = new _Buffer();
        }

        SharedBuffer(uint32_t sz) {
          this->_pbuf = new _Buffer(sz);
        }

        SharedBuffer(const SharedBuffer &src) {
          this->_pbuf = src._pbuf;
          this->use_increase();
        }

        SharedBuffer &operator=(const SharedBuffer &src) {
          this->use_decrease();
          this->_pbuf = src._pbuf;
          this->use_increase();

          return *this;
        }

        ~SharedBuffer() {
          this->use_decrease();
        }

        value_type *begin() const {
          return this->_pbuf->_data;
        }

        value_type *end() const {
          return this->_pbuf->_data + this->_pbuf->_size;
        }

        void use_increase() {
          this->_pbuf->_used++;
        }

        void use_decrease() {
          this->_pbuf->_used--;

          if (this->use_count() < 1) {
            delete _pbuf;
          }
        }

        uint32_t use_count() const {
          return this->_pbuf->_used;
        }

        uint32_t size() const {
          return this->_pbuf->_size;
        }

        void resize(uint32_t sz) {
          this->use_decrease();
          this->_pbuf = new _Buffer(sz);
        }

        void show_use_count() {}

    private :
        struct _Buffer {
            value_type *_data;
            uint32_t _size;
            uint32_t _used;

            _Buffer() : _data(nullptr), _size(0), _used(1) {}

            _Buffer(uint32_t sz) {
              this->_data = new value_type[sz];
              this->_size = sz;
              this->_used = 1;
            }

            ~_Buffer() {
              delete[] this->_data;
            }
        };

        _Buffer *_pbuf;
    };

    class Buffer {
    public :
        Buffer() {
          _offset = 0;
          _length = 0;
        }

        Buffer(value_type *p, uint32_t length, uint32_t offset = 0) {
          _offset = 0;
          _length = 0;

          this->fill(p + offset, length - offset);
        }

        Buffer(const Buffer &src) {
          _shared_buf = src._shared_buf;
          _offset = src._offset;
          _length = src._length;
        }

        Buffer &operator=(const Buffer &src) {
          _shared_buf = src._shared_buf;
          _offset = src._offset;
          _length = src._length;

          return *this;
        }

        ~Buffer() {

        }

        void resize(int size) {
          SharedBuffer tmp(size);

          _shared_buf = tmp;
          _length = size;
        }

        void output();

        void fill(value_type *p, uint32_t len);

        void check_copy_on_write() {
          if (this->_shared_buf.use_count() > 1) {
            SharedBuffer tmp;
            tmp.resize(this->_length);
            std::copy(this->begin(), this->end(), tmp.begin());
            this->_shared_buf = tmp;
            this->_offset = 0;
          }
        }

        //
        // 下标方式访问元素，只提供只读方式
        //
        value_type operator[](const uint32_t i) const {
          auto val = *(begin() + i);
          return val;
        }

        Buffer operator+(Buffer &op);

        Buffer slice(uint32_t start, uint32_t end = LIMIT_SIZE);

        static int normalize_compare_val(int val, size_t a_length, size_t b_length);

        int8_t compare(Buffer &target);

        uint32_t copy(Buffer &target, uint32_t targetStart = 0, int32_t sourceStart = 0, int32_t sourceEnd = -1);

        bool equals(Buffer &buffer);

        value_type *get_buf_ptr() { return this->begin(); }

        uint32_t get_length() { return this->_length; }

        double read_double_be(uint32_t offset = 0);

        double read_double_le(uint32_t offset = 0);

        float read_float_be(uint32_t offset = 0);

        float read_float_le(uint32_t offset = 0);

        int8_t read_int8(uint32_t offset = 0);

        uint8_t read_uint8(uint32_t offset = 0);

        int16_t read_int16_be(uint32_t offset = 0);

        uint16_t read_uint16_be(uint32_t offset = 0);

        uint32_t read_uint24_be(uint32_t offset = 0);

        int32_t read_int32_be(uint32_t offset = 0);

        uint32_t read_uint32_be(uint32_t offset = 0);

        int16_t read_int16_le(uint32_t offset = 0);

        uint16_t read_uint16_le(uint32_t offset = 0);

        int32_t read_int32_le(uint32_t offset = 0);

        uint32_t read_uint32_le(uint32_t offset = 0);

        void write_double_be(double value, uint32_t offset = 0);

        void write_double_le(double value, uint32_t offset = 0);

        void write_float_be(float value, uint32_t offset = 0);

        void write_float_le(float value, uint32_t offset = 0);

        void write_int8(int8_t value, uint32_t offset = 0);

        void write_uint8(uint8_t value, uint32_t offset = 0);

        void write_int16_be(int16_t value, uint32_t offset = 0);

        void write_uint16_be(uint16_t value, uint32_t offset = 0);

        void write_int32_be(int32_t value, uint32_t offset = 0);

        void write_uint32_be(uint32_t value, uint32_t offset = 0);

        void write_int16_le(int16_t value, uint32_t offset = 0);

        void write_uint16_le(uint16_t value, uint32_t offset = 0);

        void write_int32_le(int32_t value, uint32_t offset = 0);

        void write_uint32_le(uint32_t value, uint32_t offset = 0);

        double to_double(uint32_t x0, uint32_t x1);

        float to_float(uint32_t x);

        value_type *begin() const {
          return (_shared_buf.begin() + _offset);
        }

        value_type *end() {
          return (_shared_buf.begin() + _offset + _length);
        }

        long int use_count() const {
          return _shared_buf.use_count();
        }

    private :
        SharedBuffer _shared_buf;
        uint32_t _offset;
        uint32_t _length;
    };
}

using namespace stream;
#endif