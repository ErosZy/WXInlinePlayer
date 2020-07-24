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