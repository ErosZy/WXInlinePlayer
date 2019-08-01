# flv2h264

### 0. Example
```javascript
// more detail you can see test/index.js
let flv2h264 = new FLV2H264();

flv2h264.on('mediaInfo',(mediaInfo)=>{
    // sth to do...
});

flv2h264.on('audio:nalus', data => {
    // sth to do...
});

flv2h264.on('video:nalus', data => {
    // sth to do...
});

flv2h264.on('video:complete', () => {
    // sth to do...
});

flv2h264.decode(buf);
```