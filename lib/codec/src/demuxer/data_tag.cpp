#include "data_tag.h"

DataTagValue DataTag::decode(shared_ptr<Buffer> &buffer, uint32_t size) {
  shared_ptr<Buffer> data = make_shared<Buffer>(buffer->slice(0, size));
  uint32_t objLength = ScriptDataObject::MIN_LENGTH;
  uint32_t endLength = ScriptDataObjectEnd::MIN_LENGTH;

  for (;;) {
    uint32_t dataLength = data->get_length();
    if (dataLength == 0 || dataLength < objLength + endLength) {
      break;
    }

    ScriptDataObject dataObject;
    VarsValue ret = dataObject.decode(data);
    data = ret.buffer;

    VarsValue object;
    object.type = ret.type;
    object.arrayValue = ret.arrayValue;
    object.strValue = ret.strValue;
    object.numValue = ret.numValue;
    object.boolValue = ret.boolValue;
    object.unvalidated = ret.unvalidated;
    object.next = ret.next;
    _objects->push_back(object);
  }

  DataTagValue value;
  value.buffer = make_shared<Buffer>(buffer->slice(size));
  value.objects = _objects;
  return value;
}