cmake_minimum_required(VERSION 3.13)
project(codec)
set(CMAKE_CXX_STANDARD 11)

set(CXX_FLAGS
        -g
        -DCHECK_PTHREAD_RETURN_VALUE
        -D_FILE_OFFSET_BITS=64
        -Wextra
        -Werror
        -Wno-unused-parameter
        -Wpointer-arith
        -Wwrite-strings
        -march=native
        )

string(REPLACE ";" " " CMAKE_CXX_FLAGS "${CXX_FLAGS}")

set(CMAKE_CXX_COMPILER "g++")
set(CMAKE_CXX_FLAGS_DEBUG "-O0")
set(CMAKE_CXX_FLAGS_RELEASE "-O2 -finline-limit=1000 -DNDEBUG")
set(EXECUTABLE_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/bin)
set(LIBRARY_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/lib)

message(STATUS "Project Directory: ${PROJECT_SOURCE_DIR}")

string(TOUPPER ${CMAKE_BUILD_TYPE} BUILD_TYPE)
message(STATUS "CXX_FLAGS = " ${CMAKE_CXX_FLAGS} " " ${CMAKE_CXX_FLAGS_${BUILD_TYPE}})

include_directories(${PROJECT_SOURCE_DIR}/src)

add_subdirectory(src/stream)
add_subdirectory(src/demuxer)

add_executable(main src/main.cpp)
target_link_libraries(main stream demuxer)