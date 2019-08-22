#ifndef CODEC_VARS_H
#define CODEC_VARS_H

#include <stdint.h>
#include <string>
#include <memory.h>
#include <vector>

using namespace std;

enum VarTypes {
    NUMBER = 0,
    BOOLEAN = 1,
    STRING = 2,
    OBJECT = 3,
    MOVIECLIP = 4,
    NULLPTR = 5,
    UNDEFINED = 6,
    REF = 7,
    ECMA_ARRAY = 8,
    STRICT_ARRAY = 10,
    DATE = 11,
    LONG_STRING = 12
};

struct VarsValue {
    explicit VarsValue(bool v = false) : unvalidated(v), type(99), strValue(string("")), numValue(0), boolValue(false),
                                         arrayValue(make_shared<vector<VarsValue>>()) {};
    bool unvalidated;
    uint32_t type;
    string strValue;
    double numValue;
    bool boolValue;
    shared_ptr<vector<VarsValue>> arrayValue;
    shared_ptr<VarsValue> next;
    shared_ptr<Buffer> buffer;
};

class ScriptDataString {
public:
    static const uint32_t MIN_LENGTH;
    static const uint32_t TYPE;

    explicit ScriptDataString(bool ignoreTypeCheck = false) :
            _ignoreTypeCheck(ignoreTypeCheck), _data(""),
            _length(0) {};

    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0) {
      if (!_ignoreTypeCheck) {
        uint8_t type = buffer->read_uint8(0);
        if (type != ScriptDataString::TYPE) {
          return VarsValue(true);
        }
      }

      uint32_t offset = _ignoreTypeCheck ? 0 : 1;
      _length = buffer->read_uint16_be(offset);

      Buffer strdata = buffer->slice(2 + offset, _length + 2 + offset);
      char ptr[strdata.get_length() + 1];
      memset(ptr, '\0', strdata.get_length() + 1);
      memcpy(ptr, strdata.get_buf_ptr(), strdata.get_length());
      _data = string(ptr);

      VarsValue value;
      value.type = ScriptDataString::TYPE;
      value.strValue = _data;
      value.buffer = make_shared<Buffer>(buffer->slice(_length + 2 + offset));
      return value;
    }

private:
    bool _ignoreTypeCheck;
    uint32_t _length;
    string _data;
};

const uint32_t ScriptDataString::MIN_LENGTH = 2;
const uint32_t ScriptDataString::TYPE = 2;

class ScriptDataDate {
public:
    static const uint32_t MIN_LENGTH;
    static const uint32_t TYPE;

    explicit ScriptDataDate(bool ignoreTypeCheck = false) :
            _ignoreTypeCheck(ignoreTypeCheck), _dateTime(0),
            _localDateTimeOffset(0) {};


    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0) {
      if (!_ignoreTypeCheck) {
        uint8_t type = buffer->read_uint8(0);
        if (type != ScriptDataDate::TYPE) {
          return VarsValue(false);
        }
      }

      uint32_t offset = _ignoreTypeCheck ? 0 : 1;
      _dateTime = buffer->read_double_be(offset);
      _localDateTimeOffset = buffer->read_int16_be(8 + offset);

      VarsValue value;
      value.type = ScriptDataDate::TYPE;
      value.numValue = _dateTime;
      value.buffer = make_shared<Buffer>(buffer->slice(ScriptDataDate::MIN_LENGTH + offset));
      return value;
    }

private:
    bool _ignoreTypeCheck;
    double _dateTime;
    int16_t _localDateTimeOffset;
};

const uint32_t ScriptDataDate::MIN_LENGTH = 10;
const uint32_t ScriptDataDate::TYPE = 11;

class ScriptDataLongString {
public:
    static const uint32_t TYPE;

    explicit ScriptDataLongString(bool ignoreTypeCheck = false) :
            _ignoreTypeCheck(ignoreTypeCheck), _data(""),
            _length(0) {};

    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0) {
      if (!_ignoreTypeCheck) {
        uint8_t type = buffer->read_uint8(0);
        if (type != ScriptDataLongString::TYPE) {
          return VarsValue(true);
        }
      }

      uint32_t offset = _ignoreTypeCheck ? 0 : 1;
      _length = buffer->read_uint32_be(offset);

      Buffer strdata = buffer->slice(4 + offset, _length + 4 + offset);
      char ptr[strdata.get_length() + 1];
      memset(ptr, '\0', strdata.get_length() + 1);
      memcpy(ptr, strdata.get_buf_ptr(), strdata.get_length());
      _data = string(ptr);

      VarsValue value;
      value.type = ScriptDataLongString::TYPE;
      value.strValue = _data;
      value.buffer = make_shared<Buffer>(buffer->slice(_length + 4 + offset));
      return value;
    }

private:
    bool _ignoreTypeCheck;
    uint32_t _length;
    string _data;
};

const uint32_t ScriptDataLongString::TYPE = 12;

class ScriptDataObjectEnd {
public:
    static const uint32_t MIN_LENGTH;
    static const uint32_t TYPE;

    explicit ScriptDataObjectEnd() : _ended(false) {};

    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0) {
      uint32_t mark = buffer->read_uint24_be(0);
      if (mark != ScriptDataObjectEnd::TYPE) {
        _ended = false;
        VarsValue value(false);
        value.boolValue = _ended;
        value.buffer = buffer;
        return value;
      }

      _ended = true;
      VarsValue value;
      value.type = ScriptDataObjectEnd::TYPE;
      value.boolValue = _ended;
      value.buffer = make_shared<Buffer>(buffer->slice(3));
      return value;
    }

private:
    bool _ended;
};

const uint32_t ScriptDataObjectEnd::MIN_LENGTH = 3;
const uint32_t ScriptDataObjectEnd::TYPE = 9;

class ScriptDataVarEnd {
public:
    static const uint32_t MIN_LENGTH;
    static const uint32_t TYPE;

    ScriptDataVarEnd() : _ended(false) {};


    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0) {
      uint32_t mark = buffer->read_uint24_be(0);
      if (mark != ScriptDataVarEnd::TYPE) {
        _ended = false;
        VarsValue value(false);
        value.buffer = buffer;
        return value;
      }

      _ended = true;
      VarsValue value;
      value.type = ScriptDataVarEnd::TYPE;
      value.buffer = make_shared<Buffer>(buffer->slice(3));
      return value;
    }

private:
    bool _ended;
};

const uint32_t ScriptDataVarEnd::MIN_LENGTH = 3;
const uint32_t ScriptDataVarEnd::TYPE = 9;

class ScriptDataObject {
public:
    static const uint32_t MIN_LENGTH;
    static const uint32_t TYPE;

    ScriptDataObject(bool ignoreTypeCheck = false) : _ignoreTypeCheck(ignoreTypeCheck) {};

    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0);

private:
    bool _ignoreTypeCheck;
};

const uint32_t ScriptDataObject::MIN_LENGTH = 3;
const uint32_t ScriptDataObject::TYPE = 3;

class ScriptDataVar {
public:
    static const uint32_t MIN_LENGTH;

    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0);
};

const uint32_t ScriptDataVar::MIN_LENGTH = 3;

class ScriptDataValue {
public:
    static const uint32_t MIN_LENGTH;

    ScriptDataValue() : _type(VarTypes::UNDEFINED) {};

    VarsValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0) {
      _type = buffer->read_uint8(0);
      VarsValue value;
      value.type = _type;
      value.buffer = buffer;

      switch (_type) {
        case VarTypes::NUMBER: {
          value.numValue = buffer->read_double_be(1);
          value.buffer = make_shared<Buffer>(buffer->slice(9));
          break;
        }
        case VarTypes::BOOLEAN: {
          value.boolValue = buffer->read_uint8(1) == 1;
          value.buffer = make_shared<Buffer>(buffer->slice(2));
          break;
        }
        case VarTypes::STRING:
        case VarTypes::MOVIECLIP: {
          ScriptDataString str;
          value = str.decode(buffer);
          break;
        }
        case VarTypes::OBJECT: {
          buffer = make_shared<Buffer>(buffer->slice(1));
          value.next = make_shared<VarsValue>();
          VarsValue *ptr = &value;
          for (;;) {
            ScriptDataObject object(true);
            VarsValue ret = object.decode(buffer);
            buffer = ret.buffer;
            ptr->type = ret.type;
            ptr->arrayValue = ret.arrayValue;
            ptr->strValue = ret.strValue;
            ptr->boolValue = ret.boolValue;
            ptr->numValue = ret.numValue;
            ptr->unvalidated = ret.unvalidated;
            ptr->next = ret.next;

            ScriptDataObjectEnd objectEnd;
            ret = objectEnd.decode(buffer);
            buffer = ret.buffer;
            if (ret.boolValue) {
              break;
            } else {
              ptr->next->next = make_shared<VarsValue>();
              ptr = ptr->next->next.get();
            }
          }
          value.buffer = buffer;
          break;
        }
        case VarTypes::UNDEFINED: {
          break;
        }
        case VarTypes::NULLPTR: {
          value.buffer = make_shared<Buffer>(buffer->slice(1));
          break;
        }
        case VarTypes::REF: {
          value.numValue = buffer->read_uint16_be(1);
          value.buffer = make_shared<Buffer>(buffer->slice(3));
          break;
        }
        case VarTypes::ECMA_ARRAY: {
          uint32_t ecmaArrayLength = buffer->read_uint32_be(1);
          buffer = make_shared<Buffer>(buffer->slice(5));
          value.next = make_shared<VarsValue>();
          value.arrayValue = make_shared<vector<VarsValue>>();
          for (uint32_t i = 0; i < ecmaArrayLength; i++) {
            ScriptDataVar var;
            VarsValue ret = var.decode(buffer);
            buffer = ret.buffer;
            value.arrayValue->push_back(ret);
            ret.buffer = make_shared<Buffer>();
          }

          ScriptDataVarEnd varEnd;
          value.buffer = varEnd.decode(buffer).buffer;
          break;
        }
        case VarTypes::STRICT_ARRAY: {
          uint32_t strictArrayLength = buffer->read_uint32_be(1);
          buffer = make_shared<Buffer>(buffer->slice(5));
          value.next = make_shared<VarsValue>();
          value.arrayValue = make_shared<vector<VarsValue>>();
          for (uint32_t i = 0; i < strictArrayLength; i++) {
            ScriptDataValue val;
            VarsValue ret = val.decode(buffer);
            buffer = ret.buffer;
            value.arrayValue->push_back(ret);
            ret.buffer = make_shared<Buffer>();
          }
          value.buffer = buffer;
          break;
        }
        case VarTypes::DATE: {
          ScriptDataDate date;
          value = date.decode(buffer);
          break;
        }
        case VarTypes::LONG_STRING: {
          ScriptDataLongString longstr;
          value = longstr.decode(buffer);
          break;
        }
      }

      return value;
    }

private:
    uint32_t _type;
};

const uint32_t ScriptDataValue::MIN_LENGTH = 1;

VarsValue ScriptDataVar::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  VarsValue value;
  ScriptDataString varName(true);
  VarsValue ret = varName.decode(buffer);
  value.strValue = ret.strValue;

  ScriptDataValue varData;
  ret = varData.decode(ret.buffer);
  value.next = make_shared<VarsValue>();
  value.next->type = ret.type;
  value.next->unvalidated = ret.unvalidated;
  value.next->arrayValue = ret.arrayValue;
  value.next->boolValue = ret.boolValue;
  value.next->numValue = ret.numValue;
  value.next->strValue = ret.strValue;
  value.buffer = ret.buffer;
  return value;
}

VarsValue ScriptDataObject::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  VarsValue value;
  value.type = ScriptDataObject::TYPE;
  ScriptDataString dataName(_ignoreTypeCheck);
  VarsValue ret = dataName.decode(buffer);
  value.strValue = ret.strValue;

  ScriptDataValue dataValue;
  ret = dataValue.decode(ret.buffer);
  value.next = make_shared<VarsValue>();
  value.next->type = ret.type;
  value.next->unvalidated = ret.unvalidated;
  value.next->arrayValue = ret.arrayValue;
  value.next->boolValue = ret.boolValue;
  value.next->numValue = ret.numValue;
  value.next->strValue = ret.strValue;
  value.buffer = ret.buffer;
  return value;
}


#endif //CODEC_VARS_H
