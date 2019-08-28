add_executable(prod main.cpp)
target_link_libraries(prod stream demuxer factor h264 codec)