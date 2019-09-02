#!/usr/bin/env bash

set -x

rm -rf ./dist
mkdir dist

parcel build src/index.js --no-source-maps --target browser
cd lib/codec
bash build.sh
mv combine/prod.* ../../example