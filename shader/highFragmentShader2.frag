#version 300 es

precision highp float;
uniform sampler2D textureData;
uniform float textureCount;
uniform vec3 cameraPosition;
uniform vec4 headUV;//头部所在的矩形区域
uniform vec4 handUV;//手部所在的矩形区域
uniform vec4 bottomUV;
uniform float time;

in vec4 outTextureIndex; // 0:身体绝大部分 1:头部与手部 2:裤子 3:未使用
in vec4 outTextureFaceIndex; // 脸部索引
//in vec4 outTextureFaceWeight; // 脸部权重
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
vec2 scaling(vec2 uv,float x1,float x2,float y1,float y2,float k1,float k2,float xx1,float xx2,float yy1,float yy2){
    float u=uv.x,v=uv.y;//uv的横坐标
    float x0 =(x1+x2)/2.  ,y0 =(y1+y2)/2.  ;
    if(xx1<u&&u<xx2&&yy1<v&&v<yy2){
        float f1,f2,t1,t2;
        //横向设置
        if(u<=x1){//左边缘
            f1=k1*(x1-x0)+x0;
            f2=xx1;
            t1=x1;
            t2=xx1;
            u=(u-t1)*(f1-f2)/(t1-t2)+f1;
        }else if(u>=x2){//右边缘
            f1=k1*(x2-x0)+x0;
            f2=xx2;
            t1=x2;
            t2=xx2;
            u=(u-t1)*(f1-f2)/(t1-t2)+f1;
        }else{
            u=k1*(u-x0)+x0;
        }
        //纵向设置
        if(v<=y1){//上边缘
            f1=k2*(y1-y0)+y0;
            f2=yy1;
            t1=y1;
            t2=yy1;
        }else if(v>=y2){//下边缘
            f1=k2*(y2-y0)+y0;
            f2=yy2;
            t1=y2;
            t2=yy2;
        }else{
            v=k2*(v-y0)+y0;
        }
    }
    vec2 uv2=vec2(u,v);
    return uv2;
}

vec2 getTextureIndex(float u, float v) { // 身体各部位贴图

    if (
        (u - headUV[0]) * (headUV[2] - u) > 0. &&
        (v - headUV[1]) * (headUV[3] - v) > 0.
    )  return vec2 (outTextureIndex[1],0.); //头部
    if (
        (u - handUV[0]) * (handUV[2] - u) > 0. &&
        (v - handUV[1]) * (handUV[3] - v) > 0.
    )  return vec2 (outTextureIndex[1],1.); //手部
    if (
        (u - bottomUV[0]) * (bottomUV[2] - u) > 0. &&
        (v - bottomUV[1]) * (bottomUV[3] - v) > 0.
    )  return vec2 (outTextureIndex[2],2.); //裤子
    else return vec2 (outTextureIndex[0],3.); 

}

vec4 computeTextureColor() { // 贴图颜色
    //开始对面部进行拉伸
    float x1,x2,y1,y2,k1,k2,xx1,xx2,yy1,yy2,u,v;
    xx1=0.474,  yy1=0.878,
    x1 =0.483,  y1 =0.887,
    x2 =0.517,  y2 =0.921,
    xx2=0.536,  yy2=0.936,
    k1=1., k2=1.0;//k1:0.1-3.5
    vec2 uv=scaling(outUV,x1,x2,y1,y2,k1,k2,xx1,xx2,yy1,yy2);
    u=uv.x,v=uv.y;//uv的横坐标
    //完成对面部进行拉伸

    if (u > 0.5) u = 1. - u; // 对称
    if (u > 0.4985) u = 0.4985; // 去除中缝
    u = u * 2.;
    float textureIndex = getTextureIndex(u, v)[0];
    if (
        getTextureIndex(u, v)[1]==0.
    ){//位于面部区域，进行融合
        //u = (u + textureIndex) / textureCount;
        float u0 = (u + outTextureFaceIndex[0]) / textureCount;
        float u1 = (u + outTextureFaceIndex[1]) / textureCount;
        float u2 = (u + outTextureFaceIndex[2]) / textureCount;
        float u3 = (u + outTextureFaceIndex[3]) / textureCount;
        vec4 color0 = texture( textureData, vec2(u0, v) );
        vec4 color1 = texture( textureData, vec2(u1, v) );
        vec4 color2 = texture( textureData, vec2(u2, v) );
        vec4 color3 = texture( textureData, vec2(u3, v) );
    //return vec4(0.,0.,1.,1.);//
        float w=1.;//time*0.001;
        //float w2=(time*0.001);
            return (color0*w+color1+color2+color3)/(3.+w);
    }else{//不位于面部区域
        float u0 = (u + textureIndex ) / textureCount;
        return texture( textureData, vec2(u0, v) );

    }
    
    

}

vec3 blinnPhong( // 光照模型
    PointLight light,   //光线
    Material material,  //材质
    vec3 surfacePosition,
    vec3 surfaceNormal, //表面法向量
    vec3 viewPosition
) {

    vec3 viewDirection = normalize(viewPosition - surfacePosition);
    vec3 lightDirection = normalize(light.position - surfacePosition);
    vec3 normalDirection = normalize(surfaceNormal);

    // Ambient 环境光
    vec3 ambient = light.ambientColor * material.textureColor;

    // Diffuse
    vec3 diffuse = light.diffuseColor * material.textureColor * max(0., dot(lightDirection, normalDirection));

    // Specular  公式: (n·(v+l)/|v+l|)^g
    float specular = pow(max(0., dot(normalize(viewDirection + lightDirection), normalDirection)), material.gloss);

    return (
        material.kAmbient * ambient +
        material.kDiffuse * diffuse +
        material.kSpecular * specular
    );

}

void main() {

    PointLight light = PointLight(
        vec3(0., 40.97, 0.), // 点光源位置
        vec3(1., 1., 1.), // 漫反射颜色
        vec3(1., 1., 1.) // 高光颜色
    );

    Material material = Material(
        computeTextureColor().rgb,
        0.6, 0.3, 0.2, // 三种光照比例 环境光:漫反射:高光
        16. // 粗糙度  其值越大, 高光区域越小
    );
    

    fragColor = vec4(blinnPhong(light, material, outPosition, outNormal, cameraPosition), 1.);

}
