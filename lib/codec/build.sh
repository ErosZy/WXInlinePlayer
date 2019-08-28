#!/bin/bash

set -x
rm -rf ./bin
rm -rf ./build
mkdir ./build
cd ./build

node ../tool/compile.js wasm
emcmake cmake ..
emmake make -j 2
mv ../bin/prod.js ../bin/prod.wasm.js

node ../tool/compile.js asm
emcmake cmake ..
emmake make -j 2
mv ../bin/prod.js ../bin/prod.asm.js

node ../tool/compile.js
node ../tool/wrapper.js ../bin/prod.wasm.js wasm
node ../tool/wrapper.js ../bin/prod.asm.js asm