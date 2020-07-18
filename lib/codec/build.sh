#!/bin/bash

set -x
rm -rf ./bin
rm -rf ./build
mkdir ./build
cd ./build

# baseline decode library
node ../tool/compile.js wasm baseline
emcmake cmake ..
emmake make -j 4
mv ../bin/prod.js ../bin/baseline.wasm.js

node ../tool/compile.js asm baseline
emcmake cmake ..
emmake make -j 4
mv ../bin/prod.js ../bin/baseline.asm.js

node ../tool/compile.js
node ../tool/wrapper.js ../bin/baseline.wasm.js baseline.wasm
node ../tool/wrapper.js ../bin/baseline.asm.js baseline.asm

# all decode library
node ../tool/compile.js wasm all
emcmake cmake ..
emmake make -j 4
mv ../bin/prod.js ../bin/all.wasm.js

node ../tool/compile.js asm all
emcmake cmake ..
emmake make -j 4
mv ../bin/prod.js ../bin/all.asm.js

node ../tool/compile.js
node ../tool/wrapper.js ../bin/all.wasm.js all.wasm
node ../tool/wrapper.js ../bin/all.asm.js all.asm

## h265 decode library
node ../tool/compile.js wasm h265
emcmake cmake ..
emmake make -j 4
mv ../bin/prod.js ../bin/h265.wasm.js

node ../tool/compile.js asm h265
emcmake cmake ..
emmake make -j 4
mv ../bin/prod.js ../bin/h265.asm.js

node ../tool/compile.js
node ../tool/wrapper.js ../bin/h265.wasm.js h265.wasm
node ../tool/wrapper.js ../bin/h265.asm.js h265.asm
