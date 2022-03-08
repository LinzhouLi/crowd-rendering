#version 300 es

precision highp float;
uniform sampler2D textureData;
uniform float textureCount;

in float outTextureIndex;
in vec2 outUV;
// in vec3 outNormal;
// in vec3 outPosition;

out vec4 outColor;

vec4 computeTextureColor() {

    float u = outUV.x;
    float v = outUV.y;
    if (u > 0.5) u = 1. - u; // 对称
    if (u > 0.4985) u = 0.4985; // 去除中缝
    u = (u * 2. + outTextureIndex) / textureCount;
    vec4 color = texture( textureData, vec2(u, v) );
    return color;

}

float lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal) {

    return max(0., dot(lightDirection, surfaceNormal));

}

void main() {

    // vec3 lightPosition = vec3(0, 40.97, 0);
    // vec3 lightDirection = normalize(lightPosition - outPosition);
    // vec3 normal = normalize(outNormal);
    // float power = lambertDiffuse(lightDirection, normal);

    outColor = computeTextureColor();

}
