import { InstancedGroup } from "../lib/instancedLib/InstancedGroup.js";

class AvatarManager {

    constructor( seatPositions, camera ) {
        
        this.obj = new THREE.Object3D();
        this.seatPositions = seatPositions;
        this.camera = camera;
        this.maleParams = [];
        this.femaleParams = [];

    }

    init() {

        this.createHost();
        this.createAvatar();

    }

    createHost() {

    }

    async createAvatar() {

        // 导入动画数据
        const animationData = await this.loadJSON( "json/animations.json" );
        const animationCount = animationData.config.length;

        // 男性模型贴图资源设置
        const maleModelPath = "myModel/merged.glb";
        const maleTexturePath = "./img/texture/m/m2.jpg";
        const maleTextureCount = 32;

        // 女性性模型贴图资源设置
        const femaleModelPath = "myModel/merged.glb";
        const femaleTexturePath = "./img/texture/w/w2.jpg";
        const femaleTexureCount = 16;

        // 人群随机参数化
        const positionBias = [ 1.6, 1.2, 0 ]; // 微调人物位置
        for (let i = 0; i < this.seatPositions.length; i++) {
            let param = {
                position: vecAdd( this.seatPositions[i], positionBias ),
                scale: [ 2.6, 2.6, 2.6 ],
                animationType: Math.floor( Math.random() * animationCount ),
                color: [ Math.random() / 4, Math.random() / 4, Math.random() / 4 ],
                animationSpeed: 0.6 + Math.random() * 0.4,
                faceShape: Math.random() * 3.5
            }
            if (Math.random() < 1.1) { // 以0.6的概率生成男性
                param.textureType = Math.floor( Math.random() * maleTextureCount );
                this.maleParams.push( param );
            }
            else { // 以0.4的概率生成女性
                param.textureType = Math.floor( Math.random() * femaleTexureCount );
                this.femaleParams.push( param );
            }
        }

        // 生成实例化对象
        await this.createInstancedGroup( 
            this.maleParams, 
            maleModelPath, 
            animationData, 
            maleTexturePath, 
            maleTextureCount
        );
        await this.createInstancedGroup( 
            this.femaleParams, 
            femaleModelPath, 
            animationData, 
            femaleTexturePath, 
            femaleTexureCount
        );

        function vecAdd( a, b ) {
            return [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
        }

    }

    async createInstancedGroup( params, modelPath, animations, texturePath, textureCount ) {

        // 导入GLB模型
        const gltf = await this.loadGLB( modelPath );
        let skinnedMesh;
        gltf.scene.traverse( node => { 
            if (node instanceof THREE.SkinnedMesh) 
                skinnedMesh = node; 
        } );

        // 生成实例化对象
        const instancedGroup = new InstancedGroup(
            params.length,
            skinnedMesh,
            animations,
            texturePath,
            textureCount,
            this.camera
        );

        // 设置人群随机化参数
        const mesh = await instancedGroup.init();
        for (let i = 0; i < params.length; i++) {
            instancedGroup.setRotation( i, [Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2] ) // 使Avatar面向前方
            instancedGroup.setPosition( i, params[i].position );
            instancedGroup.setScale( i, params[i].scale );
            instancedGroup.setAnimation( i, params[i].animationType );
            instancedGroup.setSpeed( i, params[i].animationSpeed );
            instancedGroup.setTexture( i, params[i].textureType );
        }
        this.obj.add( mesh );

    }

    loadJSON( path ) {

        return new Promise( (resolve, reject) => { 
            const animationLoader = new THREE.FileLoader();
            animationLoader.load( path, data => {
                const animationData = JSON.parse( data );
                resolve( animationData );
            } );
        } );

    }

    loadGLB( path ) {

        return new Promise( (resolve, reject) => { 
            const modelLoader = new THREE.GLTFLoader();
            modelLoader.load( path, gltf => {
                resolve( gltf );
            } );
        } );

    }

}

export { AvatarManager };