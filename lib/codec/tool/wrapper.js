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

const fs = require('fs');
const path = require('path');
const argv = process.argv;
const UglifyJS = require('uglify-js');

const GLUE_PATH = path.join(__dirname, '../combine/glue.js');
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

        this.url = URL.createObjectURL(blob);
        this.worker = new Worker(this.url);
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
            window.URL.revokeObjectURL(this.url);
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
