#version 300 es

precision highp float;
uniform sampler2D textureData;
uniform float textureCount;
uniform vec3 cameraPosition;

in float outTextureIndex;
in vec2 outUV;
in vec3 outNormal;
in vec3 outPosition;

out vec4 fragColor;

struct PointLight {
    vec3 position;
    vec3 diffuseColor;
    vec3 ambientColor;
};

struct Material {
    vec3 textureColor;
    float kAmbient, kDiffuse, kSpecular; // 环境光, 漫反射, 高光 的比例
    float gloss;
};

vec4 computeTextureColor() {

    float u = outUV.x;
    float v = outUV.y;
    if (u > 0.5) u = 1. - u; // 对称
    if (u > 0.4985) u = 0.4985; // 去除中缝
    u = (u * 2. + outTextureIndex) / textureCount;
    vec4 color = texture( textureData, vec2(u, v) );
    return color;

}

vec3 blinnPhong(
    PointLight light,
    Material material,
    vec3 surfacePosition,
    vec3 surfaceNormal,
    vec3 viewPosition
) {

    vec3 viewDirection = normalize(viewPosition - surfacePosition);
    vec3 lightDirection = normalize(light.position - surfacePosition);
    vec3 normalDirection = normalize(surfaceNormal);

    // Ambient
    vec3 ambient = light.ambientColor * material.textureColor;

    // Diffuse
    vec3 diffuse = light.diffuseColor * material.textureColor * max(0., dot(lightDirection, normalDirection));

    // Specular  (n·(v+l)/|v+l|)^g
    float specular = pow(max(0., dot(normalize(viewDirection + lightDirection), normalDirection)), material.gloss);

    return (
        material.kAmbient * ambient +
        material.kDiffuse * diffuse +
        material.kSpecular * specular
    );

}

void main() {

    PointLight light = PointLight(
        vec3(0., 40.97, 0.),
        vec3(1., 1., 1.),
        vec3(1., 1., 1.)
    );

    Material material = Material(
        computeTextureColor().rgb,
        0.7, 0.15, 0.15,
        16.
    );
    

    fragColor = vec4(blinnPhong(light, material, outPosition, outNormal, cameraPosition), 1.);

}
