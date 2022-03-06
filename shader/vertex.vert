#version 300 es

precision highp float;
uniform sampler2D animationTexture;
uniform mat4 modelViewMatrix, projectionMatrix;
// uniform vec3 cameraPosition;

in vec3 position;
in vec2 inUV;
in vec3 normal;
in vec3 mcol0, mcol1, mcol2, mcol3;
in float textureIndex;

out vec2 outUV;
out vec3 outNormal;
out float outTextureIndex;
// out vec3 lightDirection;

void main() {

    outUV = inUV;
    outNormal = normal;
    outTextureIndex = textureIndex;

    // lightDirection = normalize(cameraPosition - mcol3);

    mat4 transformMatrix = mat4(
        vec4(mcol0, 0),
        vec4(mcol1, 0),
        vec4(mcol2, 0),
        vec4(mcol3, 1)
    );

    gl_Position = projectionMatrix * modelViewMatrix * transformMatrix * vec4(position, 1.0);

}
