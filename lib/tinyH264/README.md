# Tiny H264

This project was forked from [h264bsd](https://github.com/oneam/h264bsd).

All non-essential operations like color conversions, querying cropping parameters or render to canvas have been removed.
All required decoding operations have been moved to C to optimize performance. 

Quick tests show an up to 50% performance improvement on chrome, and up to 20% on Firefox.

Input is expected to be complete NALs as Uint8Array, the output result is a yuv420 buffer as Uint8Array.

This project was created for use in [Greenfield](https://github.com/udevbe/greenfield)

# Building
## Prerequisites
- Emscripten
- Rake

Make sure you have sourced the emscripten environment.

inside the `wasm` folder run `rake clean && rake`.