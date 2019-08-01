const fs = require('fs');
const path = require('path');
const argv = process.argv;

const WORKER_PATH = path.join(__dirname, './combine/TinyH264Worker.js');
const DECODER_PATH = path.join(__dirname, './combine/TinyH264Decoder.js');
const H264_PATH = path.join(__dirname, argv[2]);

const h264 = fs.readFileSync(H264_PATH).toString();
const decoder = fs.readFileSync(DECODER_PATH).toString();

let content = `
var ISIOS = /iPhone OS /i.test(window.navigator.userAgent);
var WORKER_ENABLED = !ISIOS && !!(window.URL && window.Blob && window.Worker);

function __GET_FUNC_BODY__(funcStr) {
    return funcStr.trim().match(
        /^function\\s*\\w*\\s*\\([\\w\\s,]*\\)\\s*{([\\w\\W]*?)}$/
    )[1];
}

function __TINY_H264_MAIN__(Module) {
    ${h264};
}

function __TINY_H264_DECODER__() {
    ${decoder};
}
`;

let worker = fs.readFileSync(WORKER_PATH).toString();
worker = worker.replace(/\s+/g, ' ');
content = `
${content};

var TinyH264Codec = null;
if(WORKER_ENABLED) {
    TinyH264Codec = function() {
        var url = null;
        if(TinyH264Codec.url){
            url = TinyH264Codec.url;
        }else{
            var mainBody = __GET_FUNC_BODY__(__TINY_H264_MAIN__.toString());
            var decoderBody = __GET_FUNC_BODY__(__TINY_H264_DECODER__.toString());
            var body = ['${worker}', mainBody, decoderBody].join(';');
            var blob = new Blob([body], { type: 'text/javascript' });
            var url = TinyH264Codec.url = URL.createObjectURL(blob);
        }

        this.worker = new Worker(url);

        var _me = this;
        this.destroyed = false;
        this.onmessage = function(){};
        this.onterminate = function(){};
        this.worker.onerror = function(e){
            if(_me.destroyed){
                return;
            }

            _me.destroyed = true;
            if(typeof _me.onterminate == "function"){
                _me.onterminate();
            }
            if(_me.worker){
                _me.worker.terminate();
                _me.worker.onmessage = null;
                _me.worker.onterminate = null;
                _me.worker.onerror = null;
                _me.worker = null;
            }
        };
        this.worker.onmessage = function(msg) {
            if(_me.destroyed){
                return;
            }

            var data = msg.data;
            if(data.type == "destroy"){
                _me.destroyed = true;
                if(typeof _me.onterminate == "function"){
                    _me.onterminate();
                }
                if(_me.worker){
                    _me.worker.terminate();
                    _me.worker.onmessage = null;
                    _me.worker.onterminate = null;
                    _me.worker.onerror = null;
                    _me.worker = null;
                }
                return;
            }

            if(typeof _me.onmessage == "function") {
                _me.onmessage(data);
            }
        }
    }

    TinyH264Codec.prototype.decode = function(nalus) {
        if(this.worker){
            this.worker.postMessage({
                type:'decode', 
                data: nalus
            });
        }
    }

    TinyH264Codec.prototype.destroy = function() {
        if(this.worker){
            this.worker.postMessage({type: 'destroy'});
        }
    }
}
`;

content = `
${content};
if(!WORKER_ENABLED) {
    var __codecs__ = [];
    var __codec_id__ = 0;
    function __onmessage__(data) {
        for(var i = 0; i < __codecs__.length; i++) {
            var item = __codecs__[i];
            if(item.id == data.id) {
                data.id = null;
                delete data.id;
                if(!item.destroyed && typeof item.onmessage == "function") {
                    item.onmessage(data);
                }
                break;
            }
        }
    }

    TinyH264Codec = function() {
        var _me = this;
        this.id = __codec_id__++;
        this.isInitlize = false;
        this.decoder = null;
        var Module = this.Module = {
            onRuntimeInitialized: function() {
                if(_me.isInitlize){
                    return;
                }
                
                _me.isInitlize = true;
                __TINY_H264_DECODER__();
                _me.decoder = new H264bsdDecoder(Module);
                _me.decoder.onPictureReady = function(output, width, height) {
                    __onmessage__({
                        id: _me.id,
                        type: "pictureReady",
                        width: width,
                        height: height,
                        data: output.buffer
                    });
                };
                __onmessage__({ id: _me.id, type: "decoderReady" });
            }
        }; 

        setTimeout(__TINY_H264_MAIN__.bind(this, Module), 0);
        this.destroyed = false;
        this.onmessage = function(){};
        this.onterminate = function(){};
        __codecs__.push(this);
    }

    TinyH264Codec.prototype.decode = function(nalus) {
        if(this.decoder) {
            this.decoder.decode(nalus); 
        }
    }

    TinyH264Codec.prototype.destroy = function() {
        this.destroyed = true;
        for(var i = __codecs__.length - 1; i >= 0; i--) {
            var item = __codecs__[i];
            if(item.id == this.id) {
                item.decoder.release();
                __codecs__.splice(i, 1);
                if(typeof this.onterminate == "function"){
                    this.onterminate();
                }
                if(this.worker){
                    this.worker.onmessage = null;
                    this.worker.onterminate = null;
                    this.worker = null;
                }
                break;
            }
        }
    }
}

window.TinyH264 = TinyH264Codec;
`;

fs.writeFileSync(`./index.${argv[3]}.js`, content);

