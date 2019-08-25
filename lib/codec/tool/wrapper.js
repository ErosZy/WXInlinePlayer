const fs = require("fs");
const path = require("path");
const argv = process.argv;
const UglifyJS = require("uglify-js");

const GLUE_PATH = path.join(__dirname, "../combine/glue.js");
const CODEC_PATH = path.join(__dirname, argv[2]);

const glueCodeStr = fs.readFileSync(GLUE_PATH).toString();
const codecCodeStr = fs.readFileSync(CODEC_PATH).toString();

let content = `
var WORKER_ENABLED = !!(window.URL && window.Blob && window.Worker);
function __GET_FUNC_BODY__(funcStr){
    return funcStr.trim().match(
        /^function\\s*\\w*\\s*\\([\\w\\s,]*\\)\\s*{([\\w\\W]*?)}$/
    )[1];
};

function __GLUE_EXEC__(Module){
    ${glueCodeStr};
};

function __CODEC_EXEC__(Module){
    ${codecCodeStr}
};

var H264Codec = null;
if(!WORKER_ENABLED){
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
    };

    H264Codec = function(){
        var _me = this;
        this.id = __codec_id__++;
        this.destroied = false;
        this.Module = {};
        __GLUE_EXEC__(this.Module);

        this.Module.postMessage = function(data){
            data.id = _me.id;
            __onmessage__(data);
            if(data.type == 'destroy' && typeof _me.onterminate == 'function'){
                _me.onterminate();
                _me.onterminate = null;
                _me.onmessage = null;
                for(var i = __codecs__.length - 1; i >= 0; i--){
                    if(__codecs__[i].id == _me.id){
                        __codecs__.splice(i, 1);
                        break;
                    }
                }
            }
        };

        this.onmessage = function(){};
        this.onterminate = function(){};

        setTimeout(function(){
            __CODEC_EXEC__(_me.Module);
        }, 0);

        __codecs__.push(this);
    };

    H264Codec.prototype.decode = function(buffer){
        if(this.Module){
            this.Module.onmessage({
                data: {
                    type: 'decode',
                    buffer: buffer,
                }
            });
        }
    };

    H264Codec.prototype.destroy = function(){
        this.destroied = true;
        if(this.Module){
            this.Module.onmessage({
                data: { type: 'destroy' }
            });
        }
    };
}else{
    H264Codec = function(){
        var _me = this;
        this.destroied = false;
        var glueCodeStr = __GLUE_EXEC__.toString();
        var codecCodeStr = __CODEC_EXEC__.toString();
        var blob = new Blob([[
            'var Module = {};',
            glueCodeStr, 
            codecCodeStr,
            ';__GLUE_EXEC__(Module);__CODEC_EXEC__(Module);'
        ].join(';')], {type:'text/javascript'});

        var url = URL.createObjectURL(blob);
        this.worker = new Worker(url);
        this.worker.onmessage = function(msg){
            var data = msg.data;
            if(typeof _me.onmessage == "function"){
                _me.onmessage(data);
                if(data.type == 'destroy' && typeof _me.onterminate == 'function'){
                    _me.onterminate();
                    _me.worker.terminate();
                    _me.worker = null;
                }
            }
        }

        this.worker.onterminate = function(){
            
        }

        this.onmessage = function(){};
        this.onterminate = function(){};
    };

    H264Codec.prototype.decode = function(buffer){
        if(this.worker){
            this.worker.postMessage({
                type: 'decode',
                buffer: buffer,
            });
        }
    }

    H264Codec.prototype.destroy = function(){
        this.destroied = true;
        if(this.worker){
            this.worker.postMessage({type: 'destroy'});
        }
    }
}

window.H264Codec = H264Codec;
`;

fs.writeFileSync(
  path.join(__dirname, `../combine/prod.${argv[3]}.combine.js`),
  UglifyJS.minify(content).code
);
