call parcel build src/index.js --no-source-maps --target browser
powershell mv dist/* ./example -force

REM cd lib/codec
REM bash build.sh
REM mv combine/prod.* ../../example -force