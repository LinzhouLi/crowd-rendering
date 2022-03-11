#version 300 es

precision highp float;
uniform sampler2D textureData;
uniform float textureCount;
uniform vec4 headUV;
uniform vec4 handUV;
uniform vec4 bottomUV;

in vec4 outTextureIndex;
in vec2 outUV;

out vec4 outColor;

float getTextureIndex(float u, float v) {

    if (
        (u - headUV[0]) * (headUV[2] - u) > 0. &&
        (v - headUV[1]) * (headUV[3] - v) > 0.
    ) { return outTextureIndex[1]; }
    if (
        (u - handUV[0]) * (handUV[2] - u) > 0. &&
        (v - handUV[1]) * (handUV[3] - v) > 0.
    ) { return outTextureIndex[1]; }
    if (
        (u - bottomUV[0]) * (bottomUV[2] - u) > 0. &&
        (v - bottomUV[1]) * (bottomUV[3] - v) > 0.
    ) { return outTextureIndex[2]; }
    else { return outTextureIndex[0]; }

}

vec4 computeTextureColor() {

    float u = outUV.x;
    float v = outUV.y;
    if (u > 0.5) u = 1. - u; // 对称
    if (u > 0.4985) u = 0.4985; // 去除中缝
    u = u * 2.;
    float textureIndex = getTextureIndex(u, v);
    u = (u + textureIndex) / textureCount;
    vec4 color = texture( textureData, vec2(u, v) );
    return color;

}

void main() {

    outColor = vec4(computeTextureColor().xyz * 0.8, 1.);

}
