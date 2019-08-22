#include <ctime>
#include <iostream>
#include "vars_test.h"
#include "data_tag_test.h"
#include "audio_tag_test.h"
#include "video_tag_test.h"
#include "tag_test.h"
#include "header_test.h"
#include "body_test.h"
#include "decoder_test.h"

using namespace std;

int main() {
  clock_t s = clock();
  test_vars();
  test_data_tag();
  test_audio_tag();
  test_video_tag();
  test_tag();
  test_header();
  test_body();
  test_decoder();
  cout << endl
       << "Congratulations, all done: "
       << (clock() - s) / 1000 << "ms"
       << endl;
  return 0;
}