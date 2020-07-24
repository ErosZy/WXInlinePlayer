/********************************************************
Copyright (c) <2019> <copyright ErosZy>

"Anti 996" License Version 1.0 (Draft)

Permission is hereby granted to any individual or legal entity
obtaining a copy of this licensed work (including the source code,
documentation and/or related items, hereinafter collectively referred
to as the "licensed work"), free of charge, to deal with the licensed
work for any purpose, including without limitation, the rights to use,
reproduce, modify, prepare derivative works of, distribute, publish
and sublicense the licensed work, subject to the following conditions:

1. The individual or the legal entity must conspicuously display,
without modification, this License and the notice on each redistributed
or derivative copy of the Licensed Work.

2. The individual or the legal entity must strictly comply with all
applicable laws, regulations, rules and standards of the jurisdiction
relating to labor and employment where the individual is physically
located or where the individual was born or naturalized; or where the
legal entity is registered or is operating (whichever is stricter). In
case that the jurisdiction has no such laws, regulations, rules and
standards or its laws, regulations, rules and standards are
unenforceable, the individual or the legal entity are required to
comply with Core International Labor Standards.

3. The individual or the legal entity shall not induce, suggest or force
its employee(s), whether full-time or part-time, or its independent
contractor(s), in any methods, to agree in oral or written form, to
directly or indirectly restrict, weaken or relinquish his or her
rights or remedies under such laws, regulations, rules and standards
relating to labor and employment as mentioned above, no matter whether
such written or oral agreements are enforceable under the laws of the
said jurisdiction, nor shall such individual or the legal entity
limit, in any methods, the rights of its employee(s) or independent
contractor(s) from reporting or complaining to the copyright holder or
relevant authorities monitoring the compliance of the license about
its violation(s) of the said license.

THE LICENSED WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN ANY WAY CONNECTION WITH THE
LICENSED WORK OR THE USE OR OTHER DEALINGS IN THE LICENSED WORK.
*********************************************************/
var supportSharedBuffer = false;
try {
  supportSharedBuffer = !!new SharedArrayBuffer(0);
} catch (e) {
  // nothing to do...
}

var isWorker = typeof importScripts == "function";
var bridgeName = "__CODE_BRIDGE__" + +new Date();
(isWorker ? self : window)[bridgeName] = {
  onHeader: function(header) {
    Module.postMessage({ type: "header", data: header });
  },
  onMediaInfo: function(mediaInfo) {
    Module.postMessage({ type: "mediaInfo", data: mediaInfo });
  },
  onAudioDataSize: function(data) {
    Module.audioBufferSize = data.size;
    Module.audioBuffer = Module._malloc(Module.audioBufferSize);
    Module._codecSetAudioBuffer(Module.audioBuffer);
  },
  onAudioData: function(data) {
    var timestamp = data.timestamp;
    Module.audioTimestamps.push(timestamp);

    var u8s = Module.HEAPU8.subarray(
      Module.audioBuffer,
      Module.audioBuffer + Module.audioBufferSize
    );

    var output = null;
    if (supportSharedBuffer) {
      output = new Uint8Array(new SharedArrayBuffer(u8s.byteLength));
      output.set(u8s);
    } else {
      output = new Uint8Array(u8s);
    }

    Module._free(Module.audioBuffer);
    Module.audioBuffer = null;
    Module.postMessage(
      {
        type: "audio",
        data: {
          buffer: output.buffer,
          timestamp: timestamp
        }
      },
      supportSharedBuffer ? undefined : [output.buffer]
    );
  },
  onVideoDataSize: function(data) {
    if (Module.videoBuffer == null) {
      Module.videoBufferSize = data.size;
      Module.videoBuffer = Module._malloc(Module.videoBufferSize);
      if (supportSharedBuffer) {
        Module.videoSharedBuffer = new SharedArrayBuffer(data.size);
      }
    }
    Module._codecSetVideoBuffer(Module.videoBuffer);
  },
  onVideoData: function(data) {
    var timestamp = data.timestamp;
    Module.videoTimestamps.push(timestamp);

    var u8s = Module.HEAPU8.subarray(
      Module.videoBuffer,
      Module.videoBuffer + Module.videoBufferSize
    );

    var output = null;
    if (supportSharedBuffer) {
      output = new Uint8Array(Module.videoSharedBuffer);
      output.set(u8s);
    } else {
      output = new Uint8Array(u8s);
    }
    
    Module.postMessage(
      {
        type: "video",
        data: {
          buffer: output.buffer,
          timestamp: timestamp,
          width: data.width,
          height: data.height,
          stride0: data.stride0,
          stride1: data.stride1
        }
      },
      supportSharedBuffer ? undefined : [output.buffer]
    );
  },
  onComplete: function() {
    Module.postMessage({ type: "complete" });
  }
};

var T = {
  audioTimestamps: [],
  videoTimestamps: [],
  audioBufferSize: 0,
  videoBufferSize: 0,
  audioBuffer: null,
  videoBuffer: null,
  postMessage: isWorker ? postMessage.bind(self) : function() {},
  onRuntimeInitialized: function() {
    Module._codecInit();
    var callbackStr = bridgeName.split("");
    callbackStr = callbackStr
      .map(function(v) {
        return v.charCodeAt(0);
      })
      .concat(0);

    var callbackStrData = Module._malloc(callbackStr.length - 1);
    Module.HEAPU8.set(callbackStr, callbackStrData);
    Module._codecSetBridgeName(callbackStrData);

    Module.postMessage({ type: "ready" });
  }
};

Module = Module || {};

for (var key in T) {
  if (T.hasOwnProperty(key)) {
    Module[key] = T[key];
  }
}

Module.onmessage = function(msg) {
  var data = msg.data;
  switch (data.type) {
    case "decode": {
      var buffer = new Uint8Array(data.buffer);
      var data = Module._malloc(buffer.length);
      Module.HEAPU8.set(buffer, data);

      var now = +new Date();
      Module.audioTimestamps = [];
      Module.videoTimestamps = [];
      Module._codecDecode(data, buffer.length);

      var ats = Module.audioTimestamps;
      var vts = Module.videoTimestamps;
      Module.postMessage({
        type: "decode",
        data: {
          consume: +new Date() - now,
          duration: Math.max(
            ats.length > 0 ? ats[ats.length - 1] - ats[0] : 0,
            vts.length > 0 ? vts[vts.length - 1] - vts[0] : 0
          )
        }
      });

      Module._free(data);
      break;
    }
    case "destroy": {
      if (Module.audioBuffer) {
        Module._free(Module.audioBuffer);
      }
      if (Module.videoBuffer) {
        Module._free(Module.videoBuffer);
      }
      Module._codecFree();
      Module.postMessage({ type: "destroy" });
      break;
    }
  }
};

if (isWorker) {
  self.onmessage = Module.onmessage;
}
