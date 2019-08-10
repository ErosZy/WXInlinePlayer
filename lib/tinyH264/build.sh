#!/usr/bin/env bash

set -x

rm -rf ./dist
mkdir ./dist

rm -rf ./combine/TinyH264.wasm.js
rm -rf ./combine/TinyH264.asm.js

emcc -Oz --memory-init-file 0 \
    -s TOTAL_MEMORY=33554432 \
    -s SINGLE_FILE=1 \
    -s DISABLE_EXCEPTION_CATCHING=0 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
    -s NO_EXIT_RUNTIME=0 \
    -s NO_FILESYSTEM=1 \
    -s FILESYSTEM=0 \
    -s INVOKE_RUN=0 \
    -s DOUBLE_MODE=0 \
    -s PRECISE_I64_MATH=0 \
    -s WASM=1 \
    --closure 1 \
    --llvm-opts '["-tti", "-domtree", "-tti", "-domtree", "-deadargelim", "-domtree", "-instcombine", "-domtree", "-jump-threading", "-domtree", "-instcombine", "-reassociate", "-domtree", "-loops", "-loop-rotate", "-licm", "-domtree", "-instcombine", "-loops", "-loop-idiom", "-loop-unroll", "-memdep", "-memdep", "-memcpyopt", "-domtree", "-demanded-bits", "-instcombine", "-jump-threading", "-domtree", "-memdep", "-loops", "-licm", "-adce", "-domtree", "-instcombine", "-elim-avail-extern", "-float2int", "-domtree", "-loops", "-loop-rotate", "-demanded-bits", "-instcombine", "-domtree", "-instcombine", "-loops", "-loop-unroll", "-instcombine", "-licm", "-strip-dead-prototypes", "-domtree"]' \
    --llvm-lto 3 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["getValue"]' \
    -s EXPORTED_FUNCTIONS='["_malloc", "_free", "_h264bsdAlloc", "_h264bsdFree", "_h264bsdInit", "_h264bsdDecode", "_h264bsdShutdown"]' \
    ./src/h264bsd_byte_stream.c \
    ./src/h264bsd_cavlc.c \
    ./src/h264bsd_conceal.c \
    ./src/h264bsd_deblocking.c \
    ./src/h264bsd_decoder.c \
    ./src/h264bsd_dpb.c \
    ./src/h264bsd_image.c \
    ./src/h264bsd_inter_prediction.c \
    ./src/h264bsd_intra_prediction.c \
    ./src/h264bsd_macroblock_layer.c \
    ./src/h264bsd_nal_unit.c \
    ./src/h264bsd_neighbour.c \
    ./src/h264bsd_pic_order_cnt.c \
    ./src/h264bsd_pic_param_set.c \
    ./src/h264bsd_reconstruct.c \
    ./src/h264bsd_sei.c \
    ./src/h264bsd_seq_param_set.c \
    ./src/h264bsd_slice_data.c \
    ./src/h264bsd_slice_group_map.c \
    ./src/h264bsd_slice_header.c \
    ./src/h264bsd_storage.c \
    ./src/h264bsd_stream.c \
    ./src/h264bsd_transform.c \
    ./src/h264bsd_util.c \
    ./src/h264bsd_vlc.c \
    ./src/h264bsd_vui.c \
    -o ./combine/TinyH264.wasm.js

emcc -Oz --memory-init-file 0 \
    -s TOTAL_MEMORY=33554432 \
    -s SINGLE_FILE=1 \
    -s DISABLE_EXCEPTION_CATCHING=0 \
    -s ELIMINATE_DUPLICATE_FUNCTIONS=1 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
    -s NO_EXIT_RUNTIME=0 \
    -s NO_FILESYSTEM=1 \
    -s LEGACY_VM_SUPPORT=1 \
    -s FILESYSTEM=0 \
    -s INVOKE_RUN=0 \
    -s DOUBLE_MODE=0 \
    -s PRECISE_I64_MATH=0 \
    -s WASM=0 \
    --closure 1 \
    --llvm-opts '["-tti", "-domtree", "-tti", "-domtree", "-deadargelim", "-domtree", "-instcombine", "-domtree", "-jump-threading", "-domtree", "-instcombine", "-reassociate", "-domtree", "-loops", "-loop-rotate", "-licm", "-domtree", "-instcombine", "-loops", "-loop-idiom", "-loop-unroll", "-memdep", "-memdep", "-memcpyopt", "-domtree", "-demanded-bits", "-instcombine", "-jump-threading", "-domtree", "-memdep", "-loops", "-licm", "-adce", "-domtree", "-instcombine", "-elim-avail-extern", "-float2int", "-domtree", "-loops", "-loop-rotate", "-demanded-bits", "-instcombine", "-domtree", "-instcombine", "-loops", "-loop-unroll", "-instcombine", "-licm", "-strip-dead-prototypes", "-domtree"]' \
    --llvm-lto 3 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["getValue"]' \
    -s EXPORTED_FUNCTIONS='["_malloc", "_free", "_h264bsdAlloc", "_h264bsdFree", "_h264bsdInit", "_h264bsdDecode", "_h264bsdShutdown"]' \
    ./src/h264bsd_byte_stream.c \
    ./src/h264bsd_cavlc.c \
    ./src/h264bsd_conceal.c \
    ./src/h264bsd_deblocking.c \
    ./src/h264bsd_decoder.c \
    ./src/h264bsd_dpb.c \
    ./src/h264bsd_image.c \
    ./src/h264bsd_inter_prediction.c \
    ./src/h264bsd_intra_prediction.c \
    ./src/h264bsd_macroblock_layer.c \
    ./src/h264bsd_nal_unit.c \
    ./src/h264bsd_neighbour.c \
    ./src/h264bsd_pic_order_cnt.c \
    ./src/h264bsd_pic_param_set.c \
    ./src/h264bsd_reconstruct.c \
    ./src/h264bsd_sei.c \
    ./src/h264bsd_seq_param_set.c \
    ./src/h264bsd_slice_data.c \
    ./src/h264bsd_slice_group_map.c \
    ./src/h264bsd_slice_header.c \
    ./src/h264bsd_storage.c \
    ./src/h264bsd_stream.c \
    ./src/h264bsd_transform.c \
    ./src/h264bsd_util.c \
    ./src/h264bsd_vlc.c \
    ./src/h264bsd_vui.c \
    -o ./combine/TinyH264.asm.js

node ./build.js ./combine/TinyH264.wasm.js wasm
node ./build.js ./combine/TinyH264.asm.js asm

mv index.asm.js ../../dist/TinyH264.asm.js
mv index.wasm.js ../../dist/TinyH264.wasm.js