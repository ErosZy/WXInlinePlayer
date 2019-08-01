#!/usr/bin/env bash

set -x

rm -rf ./dist
mkdir dist

parcel build src/index.js --no-source-maps --target browser
cd lib/tinyH264 && bash ./build.sh