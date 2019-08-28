#include "vars.h"

string VarsValue::to_json() {
  stringstream ss;
  switch (type) {
    case VarTypes::NUMBER:
    case VarTypes::REF:
    case VarTypes::DATE: {
      ss << numValue;
      break;
    }
    case VarTypes::BOOLEAN: {
      ss << boolValue;
      break;
    }
    case VarTypes::STRING:
    case VarTypes::MOVIECLIP:
    case VarTypes::LONG_STRING: {
      ss << "\"" << strValue << "\"";
      break;
    }
    case VarTypes::OBJECT: {
      ss << "{";
      if (!arrayValue->empty()) {
        for (uint32_t i = 0; i < arrayValue->size(); i++) {
          ss << "\"" << arrayValue->at(i).strValue << "\":" << arrayValue->at(i).next->to_json();
          if (i != arrayValue->size() - 1) {
            ss << ",";
          }
        }
      } else {
        ss << "\"" << strValue << "\":" << next->to_json();
      }
      ss << "}";
      break;
    }
    case VarTypes::NULLPTR : {
      ss << "null";
      break;
    }
    case VarTypes::UNDEFINED: {
      ss << "undefined";
      break;
    }
    case VarTypes::ECMA_ARRAY:
    case VarTypes::STRICT_ARRAY: {
      ss << "[";
      for (uint32_t i = 0; i < arrayValue->size(); i++) {
        ss << arrayValue->at(i).to_json();
        if (i != arrayValue->size() - 1) {
          ss << ",";
        }
      }
      ss << "]";
    }
    default:
      break;
  }

  return ss.str();
}

VarsValue ScriptDataVar::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  VarsValue value;
  value.type = ScriptDataVar::TYPE;
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
  value.next->next = ret.next;
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
  value.next->next = ret.next;
  value.buffer = ret.buffer;
  return value;
}