#!/usr/bin/env bash

set -x

parcel build src/index.js --no-source-maps --target browser
mv dist/* ./example

cd lib/codec
bash build.sh
mv combine/prod.* ../../example