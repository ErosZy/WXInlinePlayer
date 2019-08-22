add_executable(prod main.cpp)
target_link_libraries(prod stream demuxer factor tinyh264 codec)