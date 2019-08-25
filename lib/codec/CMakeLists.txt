cmake_minimum_required(VERSION 3.10)
project(CODEC)
set(CMAKE_CXX_STANDARD 11)

set(EXECUTABLE_OUTPUT_PATH ${PROJECT_SOURCE_DIR}/bin)
set(LIBRARY_OUTPUT_PATH  ${PROJECT_SOURCE_DIR}/lib)

include_directories(${PROJECT_SOURCE_DIR}/src)

add_subdirectory(src/stream)
add_subdirectory(src/factor)
add_subdirectory(src/demuxer)
add_subdirectory(src/h264)
add_subdirectory(src/codec)
add_subdirectory(src)

#<-----wasm----->
#set(EM_CONFIG_PARAM "-O3 -s ENVIRONMENT=\"web,worker\" -s SINGLE_FILE=1 -s WASM=1 -s FETCH=0 -s DISABLE_EXCEPTION_CATCHING=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s NO_EXIT_RUNTIME=0 -s FILESYSTEM=0 -s INVOKE_RUN=0 -s ASSERTIONS=1 -s TOTAL_MEMORY=33554432 -s EXPORTED_FUNCTIONS=\"['_codecInit', '_codecSetBridgeName', '_codecDecode', '_codecSetVideoBuffer', '_codecSetAudioBuffer', '_codecTry2Seek', '_codecFree']\"")
#<-----asm----->
#set(EM_CONFIG_PARAM "-O3 -s ENVIRONMENT=\"web,worker\" -s SINGLE_FILE=1 -s WASM=0 -s FETCH=0 -s DISABLE_EXCEPTION_CATCHING=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s NO_EXIT_RUNTIME=0 -s FILESYSTEM=0 -s TOTAL_MEMORY=33554432 -s INVOKE_RUN=0 -s LEGACY_VM_SUPPORT=1 -s MEM_INIT_METHOD=0 -s ELIMINATE_DUPLICATE_FUNCTIONS=1 -s ASSERTIONS=1 -s TOTAL_MEMORY=33554432 -s EXPORTED_FUNCTIONS=\"['_codecInit', '_codecSetBridgeName', '_codecDecode', '_codecSetVideoBuffer', '_codecSetAudioBuffer', '_codecTry2Seek', '_codecFree']\"")
set(EM_OPTIMIZE_PARAM "--closure 1 --memory-init-file 0 --llvm-lto 3")
set_target_properties(prod PROPERTIES LINK_FLAGS "${EM_CONFIG_PARAM} ${EM_OPTIMIZE_PARAM}")