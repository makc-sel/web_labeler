const vs = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform mat3 u_matrix;
out vec2 v_texCoord;
void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    v_texCoord = a_texCoord;
}`;
const fsTile = `#version 300 es
precision mediump float;
in vec2 v_texCoord;
uniform sampler2D u_image;
out vec4 outColor;
void main() {
    outColor = vec4(texture(u_image, v_texCoord).rgb, 1);
    if (outColor.rgb == vec3(0.0, 0.0, 0.0)){
        outColor.a = 0.0;
    };
    // outColor = vec4(v_texCoord,0,1);
    // outColor = vec4(texture2d(u_image, v_texCoord).xyz,1.0);
}`;
const fsBox = `#version 300 es
precision mediump float;
in vec2 v_texCoord;
uniform sampler2D u_image;
out vec4 outColor;
void main() {
    outColor = texture(u_image, v_texCoord);
    outColor.rgb *= outColor.a;
    if (v_texCoord.x < 0.05) {
        outColor = vec4(0.0 ,0.0, 0.0, 1.0);
    }
    if (v_texCoord.x > 0.95){
        outColor = vec4(0.0 ,0.0, 0.0, 1.0);
    };
    if (v_texCoord.y < 0.05) {
        outColor = vec4(0.0 ,0.0, 0.0, 1.0);
    };
    if (v_texCoord.y > 0.95){
        outColor = vec4(0.0 ,0.0, 0.0, 1.0);
    };
}`;