#version 300 es

precision highp float;
uniform sampler2D animationTexture;
uniform float boneCount, animationFrameCount, animationTextureLength;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float time;
// uniform vec3 cameraPosition;

in vec3 position;
in vec2 inUV;
in vec3 normal;
in vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼
in vec3 mcol0, mcol1, mcol2, mcol3;
in float speed;
in vec4 type; // 贴图和动画的类型

out vec2 outUV;
out vec3 outNormal;
out float textureIndex;
// out vec3 lightDirection;

vec3 getAnimationItem(float index) {

    vec3 data = texture(
        animationTexture, 
        vec2( 0.5, (0.5 + index) / animationTextureLength )
    ).xyz;
    return data;

}

mat4 computeAnimationMatrix() {

    float boneIndex = skinIndex[0];
    float animationIndex = type[3];
    float frameIndex = float(int(time * speed) % int(animationFrameCount));
    float startPos = 4. * (boneCount * (animationIndex * animationFrameCount + frameIndex) + boneIndex);
    mat4 m =  mat4(
        vec4(getAnimationItem(startPos+0.), 0),
        vec4(getAnimationItem(startPos+1.), 0),
        vec4(getAnimationItem(startPos+2.), 0),
        vec4(getAnimationItem(startPos+3.), 1)
    );
    return m;
    
}

void main() {

    outUV = inUV;
    outNormal = normal;
    textureIndex = type[0];

    // lightDirection = normalize(cameraPosition - mcol3);

    mat4 animationMatrix = computeAnimationMatrix();
    mat4 transformMatrix = mat4(
        vec4(mcol0, 0),
        vec4(mcol1, 0),
        vec4(mcol2, 0),
        vec4(mcol3, 1)
    );

    gl_Position = projectionMatrix * modelViewMatrix * transformMatrix * animationMatrix * vec4(position, 1.0);

}
