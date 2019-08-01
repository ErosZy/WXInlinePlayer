var decoder = null;
var Module = {
  onRuntimeInitialized: function() {
    decoder = new H264bsdDecoder(Module);
    decoder.onPictureReady = onPictureReady;
    postMessage({ type: "decoderReady" });
  }
};

function onMessage(e) {
  var message = e.data;
  switch (message.type) {
    case "decode":
      decoder.decode(message.data);
      break;
    case "destroy":
      decoder.release();
      postMessage({ type: "destroy" });
      break;
  }
}

function onPictureReady(output, width, height) {
  postMessage(
    {
      type: "pictureReady",
      width: width,
      height: height,
      data: output.buffer
    },
    [output.buffer]
  );
}

addEventListener("message", onMessage);
