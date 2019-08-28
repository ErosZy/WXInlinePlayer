#ifndef CODEC_DATA_TAG_H
#define CODEC_DATA_TAG_H

#include <memory>
#include <vector>
#include <map>
#include <string>
#include <stdint.h>
#include "stream/buffer.h"
#include "vars.h"

using namespace std;

struct DataTagValue {
    shared_ptr<Buffer> buffer;
    shared_ptr<vector<VarsValue>> objects;
};

class DataTag {
public:
    static const uint32_t MIN_LENGTH = 3;
    static const uint32_t TYPE = 18;

    DataTag() : _objects(make_shared<vector<VarsValue>>()) {};

    DataTagValue decode(shared_ptr<Buffer> &buffer, uint32_t size = 0);

private:
    shared_ptr<vector<VarsValue>> _objects;
};

#endif //CODEC_DATA_TAG_H
