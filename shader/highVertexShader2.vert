#version 300 es

precision highp float;
uniform sampler2D animationTexture;
uniform float boneCount, animationFrameCount, animationTextureLength;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float time;

in vec3 position;
in vec3 position2;
in vec2 inUV;
in vec3 normal;
in vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼
in vec3 mcol0, mcol1, mcol2, mcol3;
in float speed;
in float animationIndex; // 动画类型
in vec4 textureIndex;
in vec4 textureFaceIndex;
in vec4 bodyScale; // 0:身体 1:头部 2:上肢 3:下肢

out vec2 outUV;
out vec3 outNormal;
out vec4 outTextureIndex;
out vec4 outTextureFaceIndex;
out vec3 outPosition;

float getBoneScale(float bone) { // 身体形变

    if ( bone < 3.5 || (bone > 5.5 && bone < 6.5) || (bone > 15.5 && bone < 16.5) ) // 身体
        return bodyScale[0];
    if ( bone > 4.5 && bone < 5.5 ) // 头部
        return bodyScale[1];
    if ( bone > 6.5 && bone < 15.5 || (bone > 16.5 && bone < 25.5) ) // 上肢
        return bodyScale[2];
    if ( bone > 25.5 ) // 下肢
        return bodyScale[3];
    else return 1.;
    
}

float computeBodyScale() {

    return (
        skinWeight[0] * getBoneScale(skinIndex[0]) + 
        skinWeight[1] * getBoneScale(skinIndex[1]) +
        skinWeight[2] * getBoneScale(skinIndex[2]) +
        skinWeight[3] * getBoneScale(skinIndex[3])
    );

}

vec3 getAnimationItem(float index) { // 从texture中提取矩阵元素

    float v = floor(index / animationTextureLength);
    float u = index - v * animationTextureLength;
    vec3 data = texture(
        animationTexture, 
        vec2( (0.5 + u) / animationTextureLength, (0.5 + v) / animationTextureLength )
    ).xyz;
    return data;

}

mat4 computeAnimationMatrix(float boneIndex, float frameIndex) { // 计算一个骨骼的变换矩阵

    float startPos = 4. * (boneCount * (animationIndex * animationFrameCount + frameIndex) + boneIndex);
    return mat4(
        vec4(getAnimationItem(startPos + 0.), 0.),
        vec4(getAnimationItem(startPos + 1.), 0.),
        vec4(getAnimationItem(startPos + 2.), 0.),
        vec4(getAnimationItem(startPos + 3.), 1.)
    );
    
}

vec3 vertexBlending(vec3 position, float frameIndex) { // 动画形变, 计算4个骨骼的影响

    if ( animationTextureLength < 0.5) return position; // 动画未加载

    vec4 temp = vec4(position, 1.);
    vec4 result = vec4(0., 0., 0., 0.);
    result += skinWeight[0] * computeAnimationMatrix(skinIndex[0], frameIndex) * temp;
    result += skinWeight[1] * computeAnimationMatrix(skinIndex[1], frameIndex) * temp;
    result += skinWeight[2] * computeAnimationMatrix(skinIndex[2], frameIndex) * temp;
    result += skinWeight[3] * computeAnimationMatrix(skinIndex[3], frameIndex) * temp;
    return result.xyz;

}

vec3 frameInterpolation(vec3 position) { // 点坐标插值, 考虑优化:变换矩阵插值

    float m = floor(time * speed / animationFrameCount);
    float temp = time * speed - m * animationFrameCount;
    float frameIndex1 = floor(temp);
    float weight = temp - frameIndex1; // 插值权重
    float frameIndex2 = float(int(frameIndex1 + 1.) % int(animationFrameCount));

    vec3 p1 = vertexBlending(position, frameIndex1);
    vec3 p2 = vertexBlending(position, frameIndex2);

    return (1. - weight) * p1 + weight * p2;

}
float modFloor(float a,float b){
    return a-b*floor(a/b);
}

void main() {

    outUV = inUV;
    outTextureIndex = textureIndex;
    outTextureFaceIndex = textureFaceIndex;//面部索引

    mat4 transformMatrix = mat4(
        vec4(mcol0, 0.),
        vec4(mcol1, 0.),
        vec4(mcol2, 0.),
        vec4(mcol3, 1.)
    );
    
    float s = computeBodyScale(); // 身体形变,暂不使用
    //float w=modFloor(time*0.01,5.);
    //float w=time*0.05;
    float w=0.;//modFloor(time*0.09, 2.);
    //if (w>1.)w=2.-w;
    vec3 position0=(position*(1.-w)+position2*w);
    vec4 worldPosition = transformMatrix * vec4(frameInterpolation( 
        vec3(position0.x*s , position0.y ,  position0.z*s ) 
        ), 1.); // 世界坐标下的顶点位置
    vec4 normal = transformMatrix * vec4(frameInterpolation(normal), 0.); // 世界坐标下的顶点向量
    outNormal = normal.xyz;
    outPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;

}
