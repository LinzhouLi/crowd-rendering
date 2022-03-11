#version 300 es

precision highp float;
uniform sampler2D animationTexture;
uniform float boneCount, animationFrameCount, animationTextureLength;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float time;

in vec3 position;
in vec2 inUV;
in vec3 normal;
in vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼
in vec3 mcol0, mcol1, mcol2, mcol3;
in float speed;
in float animationIndex; // 动画类型
in vec4 textureIndex;

out vec2 outUV;
out vec3 outNormal;
out vec4 outTextureIndex;
out vec3 outPosition;

vec3 getAnimationItem(float index) {

    vec3 data = texture(
        animationTexture, 
        vec2( 0.5, (0.5 + index) / animationTextureLength )
    ).xyz;
    return data;

}

mat4 computeAnimationMatrix(float boneIndex) {

    float frameIndex = float(int(time * speed) % int(animationFrameCount));
    float startPos = 4. * (boneCount * (animationIndex * animationFrameCount + frameIndex) + boneIndex);
    return mat4(
        vec4(getAnimationItem(startPos+0.), 0.),
        vec4(getAnimationItem(startPos+1.), 0.),
        vec4(getAnimationItem(startPos+2.), 0.),
        vec4(getAnimationItem(startPos+3.), 1.)
    );
    
}

vec3 vertexBlending(vec3 vector) {

    vec4 temp = vec4(vector, 1.);
    vec4 result = vec4(0., 0., 0., 0.);
    result += skinWeight[0] * computeAnimationMatrix(skinIndex[0]) * temp;
    result += skinWeight[1] * computeAnimationMatrix(skinIndex[1]) * temp;
    result += skinWeight[2] * computeAnimationMatrix(skinIndex[2]) * temp;
    result += skinWeight[3] * computeAnimationMatrix(skinIndex[3]) * temp;
    return result.xyz;

}

void main() {

    outUV = inUV;
    outTextureIndex = textureIndex;

    mat4 transformMatrix = mat4(
        vec4(mcol0, 0.),
        vec4(mcol1, 0.),
        vec4(mcol2, 0.),
        vec4(mcol3, 1.)
    );

    vec4 position = transformMatrix * vec4(vertexBlending(position), 1.);
    vec4 normal = transformMatrix * vec4(vertexBlending(normal), 0.);
    outNormal = normal.xyz;
    outPosition = position.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * position;

}
