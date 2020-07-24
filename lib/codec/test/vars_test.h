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

#ifndef CODEC_VARS_TEST_H
#define CODEC_VARS_TEST_H

#include <iostream>
#include <stdint.h>
#include "vassert.h"
#include "stream/buffer.h"
#include "demuxer/vars.h"

using namespace std;

void test_script_data_string() {
  uint8_t ptr[] = {0x02, 0x00, 0x0a, 0x6f, 0x6e, 0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 13);
  ScriptDataString dataString(false);
  VarsValue value = dataString.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 2, "");
  VASSERT(value.strValue == string("onMetaData"), "");
  VASSERT(value.buffer->get_length() == 0, "");

  b = make_shared<Buffer>(b->slice(1));
  ScriptDataString dataString_unvalidate(true);
  value = dataString_unvalidate.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 2, "");
  VASSERT(value.strValue == string("onMetaData"), "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "ScriptDataString pass");
}

void test_script_data_date() {
  uint8_t ptr[] = {0x0b, 0x40, 0x3c, 0x0b, 0x85, 0x1e, 0xb8, 0x51, 0xec, 0x11, 0x12};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 11);
  ScriptDataDate dataDate(false);
  VarsValue value = dataDate.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 11, "");
  VASSERT(value.numValue - 28.045 <= 1e-8, "");
  VASSERT(value.buffer->get_length() == 0, "");

  b = make_shared<Buffer>(b->slice(1));
  ScriptDataDate dataDate_unvalidate(true);
  value = dataDate_unvalidate.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 11, "");
  VASSERT(value.numValue - 28.045 <= 1e-8, "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "ScriptDataDate pass");
}

void test_script_data_long_string() {
  uint8_t ptr[] = {0x0c, 0x00, 0x00, 0x00, 0x0a, 0x6f, 0x6e,
                   0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 15);
  ScriptDataLongString dataLongString(false);
  VarsValue value = dataLongString.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 12, "");
  VASSERT(value.strValue == string("onMetaData"), "");
  VASSERT(value.buffer->get_length() == 0, "");

  b = make_shared<Buffer>(b->slice(1));
  ScriptDataLongString dataLongString_unvalidate(true);
  value = dataLongString_unvalidate.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 12, "");
  VASSERT(value.strValue == string("onMetaData"), "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "ScriptDataLongString pass");
}

void test_script_data_value_simple() {
  // number
  {
    uint8_t ptr[] = {0x00, 0x40, 0x3c, 0x0b, 0x85, 0x1e, 0xb8, 0x51, 0xec};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 9);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 0, "");
    VASSERT(value.numValue - 28.045 <= 1e-8, "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  // boolean
  {
    uint8_t ptr[] = {0x01, 0x01};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 2);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 1, "");
    VASSERT(value.boolValue, "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  // string
  {
    uint8_t ptr[] = {0x02, 0x00, 0x0a, 0x6f, 0x6e, 0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 13);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 2, "");
    VASSERT(value.strValue == string("onMetaData"), "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  {
    uint8_t ptr[] = {0x05};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 1);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 5, "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  // ref
  {
    uint8_t ptr[] = {0x07, 0x11, 0x12};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 3);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 7, "");
    VASSERT(value.numValue - 4370 < 1e-12, "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  // date
  {
    uint8_t ptr[] = {0x0b, 0x40, 0x3c, 0x0b, 0x85, 0x1e, 0xb8, 0x51, 0xec, 0x11, 0x12};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 11);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 11, "");
    VASSERT(value.numValue - 28.045 <= 1e-8, "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  // long string
  {
    uint8_t ptr[] = {0x0c, 0x00, 0x00, 0x00, 0x0a, 0x6f, 0x6e,
                     0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 15);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 12, "");
    VASSERT(value.strValue == string("onMetaData"), "");
    VASSERT(value.buffer->get_length() == 0, "");
  }


  VASSERT(true, "ScriptDataValue simple value pass");
}

void test_script_data_variable_simple() {
  {
    uint8_t ptr[] = {0x00, 0x0a, 0x6f, 0x6e, 0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61,
                     0x07, 0x11, 0x12};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 15);
    ScriptDataVar var;
    VarsValue value = var.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.strValue == string("onMetaData"), "");
    VASSERT(value.buffer->get_length() == 0, "");
    VASSERT(value.next->type == 7, "");
    VASSERT(value.next->numValue - 4370 < 1e-12, "");
  }

  {
    uint8_t ptr[] = {0x00, 0x0a, 0x6f, 0x6e, 0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61,
                     0x0c, 0x00, 0x00, 0x00, 0x0a, 0x6f, 0x6e, 0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74,
                     0x61};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 27);
    ScriptDataVar var;
    VarsValue value = var.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.strValue == string("onMetaData"), "");
    VASSERT(value.buffer->get_length() == 0, "");
    VASSERT(value.next->strValue == string("onMetaData"), "");
  }

  {
    uint8_t ptr[] = {0x00, 0x0a, 0x6f, 0x6e, 0x4d, 0x65, 0x74, 0x61, 0x44, 0x61, 0x74, 0x61,
                     0x01, 0x01};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 14);
    ScriptDataVar var;
    VarsValue value = var.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.strValue == string("onMetaData"), "");
    VASSERT(value.buffer->get_length() == 0, "");
    VASSERT(value.next->boolValue, "");
  }

  VASSERT(true, "ScriptDataVar simple value pass");
}

void test_script_data_ecma_array() {
  uint8_t ptr[] = {0x08, 0x00, 0x00, 0x00, 0x02,
                   0x00, 0x0b, 0x64, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x69, 0x6f, 0x6e,
                   0x02, 0x00, 0x49, 0x50, 0x61, 0x63, 0x6b, 0x65, 0x64, 0x20, 0x62, 0x79, 0x20,
                   0x42, 0x69, 0x6c, 0x69, 0x62, 0x69, 0x6c, 0x69, 0x20, 0x58, 0x43, 0x6f, 0x64,
                   0x65, 0x72, 0x20, 0x28, 0x42, 0x69, 0x6c, 0x69, 0x62, 0x69, 0x6c, 0x69, 0x20,
                   0x58, 0x43, 0x6f, 0x64, 0x65, 0x20, 0x57, 0x6f, 0x72, 0x6b, 0x65, 0x72, 0x20,
                   0x76, 0x34, 0x2e, 0x31, 0x2e, 0x30, 0x29, 0x28, 0x66, 0x69, 0x78, 0x65, 0x64,
                   0x5f, 0x67, 0x61, 0x70, 0x3a, 0x46, 0x61, 0x6c, 0x73, 0x65, 0x29,
                   0x00, 0x0b, 0x63, 0x64, 0x75, 0x67, 0x78, 0x69, 0x70, 0x71, 0x62, 0x34, 0x55,
                   0x02, 0x00, 0x49, 0x50, 0x61, 0x63, 0x6b, 0x65, 0x64, 0x20, 0x62, 0x79, 0x20,
                   0x42, 0x69, 0x6c, 0x69, 0x62, 0x69, 0x6c, 0x69, 0x20, 0x58, 0x43, 0x6f, 0x64,
                   0x65, 0x72, 0x20, 0x28, 0x42, 0x69, 0x6c, 0x69, 0x62, 0x69, 0x6c, 0x69, 0x20,
                   0x58, 0x43, 0x6f, 0x64, 0x65, 0x20, 0x57, 0x6f, 0x72, 0x6b, 0x65, 0x72, 0x20,
                   0x76, 0x34, 0x2e, 0x31, 0x2e, 0x30, 0x29, 0x28, 0x66, 0x69, 0x78, 0x65, 0x64,
                   0x5f, 0x67, 0x61, 0x70, 0x3a, 0x46, 0x61, 0x6c, 0x73, 0x65, 0x29,
                   0x00, 0x00, 0x09};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 186);
  ScriptDataValue dataValue;
  VarsValue value = dataValue.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 8, "");
  VASSERT(value.arrayValue->size() == 2, "");
  VASSERT(value.arrayValue->at(0).strValue == string("description"), "");
  VASSERT(value.arrayValue->at(0).next->strValue ==
          string("Packed by Bilibili XCoder (Bilibili XCode Worker v4.1.0)(fixed_gap:False)"), "");
  VASSERT(value.arrayValue->at(1).strValue == string("cdugxipqb4U"), "");
  VASSERT(value.arrayValue->at(1).next->strValue ==
          string("Packed by Bilibili XCoder (Bilibili XCode Worker v4.1.0)(fixed_gap:False)"), "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "ScriptDataECMAArray pass");
}

void test_script_data_strict_array() {
  uint8_t ptr[] = {0x0a, 0x00, 0x00, 0x00, 0x04,
                   0x00, 0x40, 0xa1, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                   0x00, 0x40, 0xa1, 0xa6, 0x00, 0x00, 0x00, 0x00, 0x00,
                   0x00, 0x41, 0x32, 0x1a, 0xc0, 0x00, 0x00, 0x00, 0x00,
                   0x00, 0x41, 0x50, 0xee, 0x34, 0xc0, 0x00, 0x00, 0x00};
  shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 41);
  ScriptDataValue dataValue;
  VarsValue value = dataValue.decode(b, 0);
  VASSERT(!value.unvalidated, "");
  VASSERT(value.type == 10, "");
  VASSERT(value.arrayValue->size() == 4, "");
  VASSERT(value.arrayValue->at(0).numValue - 2178 < 1e-12, "");
  VASSERT(value.arrayValue->at(1).numValue - 2259 < 1e-12, "");
  VASSERT(value.arrayValue->at(2).numValue - 1186496 < 1e-12, "");
  VASSERT(value.arrayValue->at(1).numValue - 4438227 < 1e-12, "");
  VASSERT(value.buffer->get_length() == 0, "");

  VASSERT(true, "ScriptDataStrictArray pass");
}

void test_script_data_object() {
  {
    uint8_t ptr[] = {0x00, 0x0d, 0x66, 0x69, 0x6c, 0x65, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x73,
                     0x0a, 0x00, 0x00, 0x00, 0x04,
                     0x00, 0x40, 0xa1, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x40, 0xa1, 0xa6, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x41, 0x32, 0x1a, 0xc0, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x41, 0x50, 0xee, 0x34, 0xc0, 0x00, 0x00, 0x00};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 56);
    ScriptDataObject dataObject(true);
    VarsValue value = dataObject.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 3, "");
    VASSERT(value.strValue == string("filepositions"), "");
    VASSERT(value.next->arrayValue->size() == 4, "");
    VASSERT(value.next->arrayValue->at(0).numValue - 2178 < 1e-12, "");
    VASSERT(value.next->arrayValue->at(1).numValue - 2259 < 1e-12, "");
    VASSERT(value.next->arrayValue->at(2).numValue - 1186496 < 1e-12, "");
    VASSERT(value.next->arrayValue->at(3).numValue - 4438227 < 1e-12, "");
  }

  {
    uint8_t ptr[] = {0x03,
                     0x00, 0x0d, 0x66, 0x69, 0x6c, 0x65, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x73,
                     0x0a, 0x00, 0x00, 0x00, 0x04,
                     0x00, 0x40, 0xa1, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x40, 0xa1, 0xa6, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x41, 0x32, 0x1a, 0xc0, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x41, 0x50, 0xee, 0x34, 0xc0, 0x00, 0x00, 0x00,
                     0x00, 0x0d, 0x66, 0x69, 0x6c, 0x65, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x73,
                     0x0a, 0x00, 0x00, 0x00, 0x04,
                     0x00, 0x40, 0xa1, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x40, 0xa1, 0xa6, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x41, 0x32, 0x1a, 0xc0, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x41, 0x50, 0xee, 0x34, 0xc0, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x09};
    shared_ptr<Buffer> b = make_shared<Buffer>(ptr, 116);
    ScriptDataValue dataValue;
    VarsValue value = dataValue.decode(b, 0);
    VASSERT(!value.unvalidated, "");
    VASSERT(value.type == 3, "");
    VASSERT(value.arrayValue->at(0).strValue == string("filepositions"), "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->size() == 4, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(0).numValue - 2178 < 1e-12, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(1).numValue - 2259 < 1e-12, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(2).numValue - 1186496 < 1e-12, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(3).numValue - 4438227 < 1e-12, "");
    VASSERT(value.arrayValue->at(1).strValue == string("filepositions"), "");
    VASSERT(value.arrayValue->at(1).next->arrayValue->size() == 4, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(0).numValue - 2178 < 1e-12, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(1).numValue - 2259 < 1e-12, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(2).numValue - 1186496 < 1e-12, "");
    VASSERT(value.arrayValue->at(0).next->arrayValue->at(3).numValue - 4438227 < 1e-12, "");
    VASSERT(value.buffer->get_length() == 0, "");
  }

  VASSERT(true, "ScriptDataObject pass");
}

void test_vars() {
  cout << "\033[33m " << "vars: \033[0m" << endl;
  test_script_data_string();
  test_script_data_date();
  test_script_data_long_string();
  test_script_data_value_simple();
  test_script_data_variable_simple();
  test_script_data_ecma_array();
  test_script_data_strict_array();
  test_script_data_object();
}

#endif //CODEC_VARS_TEST_H
