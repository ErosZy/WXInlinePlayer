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

class Drawer {
  constructor($canvas) {
    this.$canvas = $canvas;
    this.contextGL = null;
    this.shaderProgram = null;
    this.texturePosBuffer = null;
    this.yTextureRef = null;
    this.uTextureRef = null;
    this.vTextureRef = null;
    this._initContextGL();

    if (this.contextGL) {
      this._initProgram();
      this._initBuffers();
      this._initTextures();
    }
  }

  static isSupport() {
    const canvas = document.createElement('canvas');
    const validContextNames = [
      'webgl',
      'experimental-webgl',
      'moz-webgl',
      'webkit-3d'
    ];

    let gl = null;
    let nameIndex = 0;
    while (!gl && nameIndex < validContextNames.length) {
      var contextName = validContextNames[nameIndex];
      try {
        gl = canvas.getContext(contextName, { preserveDrawingBuffer: true });
      } catch (e) {
        gl = null;
      }
      if (!gl || typeof gl.getParameter !== 'function') {
        gl = null;
      }
      ++nameIndex;
    }

    return !!gl;
  }

  drawNextOutputPicture(width, height, data) {
    const { yTextureRef, uTextureRef, vTextureRef } = this;
    const gl = this.contextGL;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.viewport(0, 0, width, height);

    const i420Data = data;
    const yDataLength = width * height;
    const yData = i420Data.subarray(0, yDataLength);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width,
      height,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      yData
    );

    const cbDataLength = width * height / 4;
    const cbData = i420Data.subarray(yDataLength, yDataLength + cbDataLength);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width / 2,
      height / 2,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      cbData
    );

    const crDataLength = cbDataLength;
    const crData = i420Data.subarray(
      yDataLength + cbDataLength,
      yDataLength + cbDataLength + crDataLength
    );

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width / 2,
      height / 2,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      crData
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    try {
      this.contextGL.getExtension('WEBGL_lose_context').loseContext();
    } catch (e) {}

    this.$canvas = null;
    this.contextGL = null;
    this.shaderProgram = null;
    this.texturePosBuffer = null;
    this.yTextureRef = null;
    this.uTextureRef = null;
    this.vTextureRef = null;
  }

  _initContextGL() {
    const canvas = this.$canvas;
    const validContextNames = [
      'webgl',
      'experimental-webgl',
      'moz-webgl',
      'webkit-3d'
    ];

    let gl = null;
    let nameIndex = 0;
    while (!gl && nameIndex < validContextNames.length) {
      var contextName = validContextNames[nameIndex];
      try {
        gl = canvas.getContext(contextName);
      } catch (e) {
        gl = null;
      }
      if (!gl || typeof gl.getParameter !== 'function') {
        gl = null;
      }
      ++nameIndex;
    }

    this.contextGL = gl;
  }

  _initProgram() {
    const gl = this.contextGL;
    const vertexShaderScript = `
    attribute vec4 vertexPos;
    attribute vec4 texturePos;
    varying vec2 textureCoord;
    void main(){
        gl_Position = vertexPos; 
        textureCoord = texturePos.xy;
    }
    `;

    const fragmentShaderScript = `
    precision highp float;
    varying highp vec2 textureCoord;
    uniform sampler2D ySampler;
    uniform sampler2D uSampler;
    uniform sampler2D vSampler;
    const mat4 YUV2RGB = mat4(
        1.1643828125, 0, 1.59602734375, -.87078515625,
        1.1643828125, -.39176171875, -.81296875, .52959375,
        1.1643828125, 2.017234375, 0, -1.081390625,
        0, 0, 0, 1
    );

    void main(void) {
        highp float y = texture2D(ySampler,  textureCoord).r;
        highp float u = texture2D(uSampler,  textureCoord).r;
        highp float v = texture2D(vSampler,  textureCoord).r;
        gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;
    }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderScript);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.log(
        'Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader)
      );
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderScript);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.log(
        'Fragment shader failed to compile: ' +
          gl.getShaderInfoLog(fragmentShader)
      );
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log(
        'Program failed to compile: ' + gl.getProgramInfoLog(program)
      );
    }

    gl.useProgram(program);
    this.shaderProgram = program;
  }

  _initBuffers() {
    const gl = this.contextGL;
    const program = this.shaderProgram;
    const vertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
      gl.STATIC_DRAW
    );

    const vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
    gl.enableVertexAttribArray(vertexPosRef);
    gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);

    const texturePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]),
      gl.STATIC_DRAW
    );

    var texturePosRef = gl.getAttribLocation(program, 'texturePos');
    gl.enableVertexAttribArray(texturePosRef);
    gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);

    this.texturePosBuffer = texturePosBuffer;
  }

  _initTextures() {
    const gl = this.contextGL;
    const program = this.shaderProgram;

    const yTextureRef = this._initTexture();
    const ySamplerRef = gl.getUniformLocation(program, 'ySampler');
    gl.uniform1i(ySamplerRef, 0);
    this.yTextureRef = yTextureRef;

    const uTextureRef = this._initTexture();
    const uSamplerRef = gl.getUniformLocation(program, 'uSampler');
    gl.uniform1i(uSamplerRef, 1);
    this.uTextureRef = uTextureRef;

    const vTextureRef = this._initTexture();
    const vSamplerRef = gl.getUniformLocation(program, 'vSampler');
    gl.uniform1i(vSamplerRef, 2);
    this.vTextureRef = vTextureRef;
  }

  _initTexture() {
    const gl = this.contextGL;
    const textureRef = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureRef);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return textureRef;
  }
}

export default Drawer;
