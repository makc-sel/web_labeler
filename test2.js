const vs = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform mat3 u_matrix;
out vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
}`;
const fs = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 outColor;
void main() {
    outColor = vec4(texture(u_texture, v_texCoord).rgb,1);
    if (v_texCoord.x<0.1){
        outColor = vec4(0.0,0.0,0.0,1.0);
    }
    if (v_texCoord.x>0.9){
        outColor = vec4(0.0,0.0,0.0,1.0);
    }
    // outColor = vec4(v_texCoord,0,1);
}`;

const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");

var coordPerPoint = 2;
var rectPos = [
    -0.5, 0.5,
    0.5, 0.5,
    -0.5, -0.5,
    -0.5, -0.5,
    0.5, 0.5,
    0.5, -0.5
];
var texPos = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
];

var bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: {
        data: rectPos,
        numComponents: coordPerPoint
    },
    a_texCoord: {
        data: texPos,
        numComponents: coordPerPoint
    }
});

let shaderProgram = twgl.createProgramInfo(gl, [vs, fs]);
// var texture = twgl.createTextures(gl, {
//     src: "https://farm6.staticflickr.com/5795/21506301808_efb27ed699_q_d.jpg",
//     color: [0, 1, 0, 1]
// });
// create an offscreen canvas with a 2D canvas context
var tex;
var ctx = document.createElement("canvas").getContext("2d");
var img = new Image();
img.onload = function () {
    ctx.drawImage(img, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    requestAnimationFrame(render);
};
img.src = "https://webgl2fundamentals.org/webgl/resources/leaves.jpg";

function render() {
    gl.useProgram(shaderProgram.program);
    twgl.setBuffersAndAttributes(gl, shaderProgram, bufferInfo);
    twgl.setUniforms(shaderProgram, { u_matrix: m3.identity(), u_texture: tex });
    twgl.drawBufferInfo(gl, bufferInfo);
    requestAnimationFrame(render);
}