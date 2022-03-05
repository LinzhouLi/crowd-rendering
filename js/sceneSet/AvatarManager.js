import { InstancedGroup } from "../lib/instancedLib/InstancedGroup.js";
import { LODController } from "../lib/instancedLib/LODController.js";

class AvatarManager {

    constructor( seatPositions, camera ) {
        
        this.obj = new THREE.Object3D();
        this.seatPositions = seatPositions;
        this.camera = camera;
        this.lodController = new LODController( seatPositions, camera );
        this.created = false;

        this.manager = {
            params: [],
            LODParams: { // 3级LOD
                male: {
                    maxCount: [ 200, 2000, 7000 ],
                    availableIndices: [ ]
                },
                female: {
                    maxCount: [ 200, 2000, 7000 ],
                    availableIndices: [ ]
                }
            },
            instanceGroup: {
                male: [],
                female: []
            }
        };

        for (let i = 0; i < 3; i++) {
            this.manager.LODParams.male.availableIndices.push( range( this.manager.LODParams.male.maxCount[i] ) );
            this.manager.LODParams.female.availableIndices.push( range( this.manager.LODParams.female.maxCount[i] ) );
        }
        console.log(this.manager)
        function range( count ) {
            return new Array( count ).fill( 0 ).map( (v, i) => i );
        }

    }

    init() {

        this.createHost();
        this.createAvatar();

    }

    updateLOD() {

        let lod = this.lodController.update();
        for (let i = 0; i < lod.length; i++) {
            if (lod[i] != this.manager.params[i].LOD) {
                
                let param = this.manager.params[i];

                this.unsetInstanceParam( param );

                param.LOD = lod[i];
                param.index = this.manager.LODParams[param.sex].availableIndices[param.LOD].pop();
                if(param.index==undefined)console.log(param.LOD,param.index)
                this.setInstanceParam( param );

            }
        }

    }

    unsetInstanceParam( param ) {

        if ( param.index != -1 ) {
            if ( param.LOD == 0) {
            const instanceGroup = this.manager.instanceGroup[param.sex][param.LOD];
            instanceGroup.reset( param.index );
            }
            this.manager.LODParams[param.sex].availableIndices[param.LOD].push( param.index );
        }

    }

    setInstanceParam( param ) {

        if (param.LOD != 0) return;
        const instanceGroup = this.manager.instanceGroup[param.sex][param.LOD];
        instanceGroup.setAnimation( param.index, param.animationType );
        instanceGroup.setSpeed( param.index, param.animationSpeed );
        instanceGroup.setTexture( param.index, param.textureType );
        instanceGroup.setRotation( param.index, [Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2] ) // 使Avatar面向前方
        instanceGroup.setPosition( param.index, param.position );
        instanceGroup.setScale( param.index, param.scale );

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
                animationSpeed: 0.2 + Math.random() * 0.1,
                LOD: -1,
                index: -1
            }
            if (Math.random() < 1.1) { // 以0.6的概率生成男性
                param.textureType = Math.floor( Math.random() * maleTextureCount );
                param.sex = "male";
            }
            else { // 以0.4的概率生成女性
                param.textureType = Math.floor( Math.random() * femaleTexureCount );
                param.sex = "female";
            }
            this.manager.params.push( param );
        }

        // 生成实例化对象
        const maleInstanceGroupL0 = await this.createInstancedGroup( 
            this.manager.LODParams.male.maxCount[0], 
            maleModelPath, 
            animationData, 
            maleTexturePath, 
            maleTextureCount
        );
        this.manager.instanceGroup.male.push( maleInstanceGroupL0 );
        // await this.createInstancedGroup( 
        //     this.femaleParams, 
        //     femaleModelPath, 
        //     animationData, 
        //     femaleTexturePath, 
        //     femaleTexureCount
        // );

        this.created = true;

        function vecAdd( a, b ) {
            return [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
        }

    }

    async createInstancedGroup( count, modelPath, animations, texturePath, textureCount ) {

        // 导入GLB模型
        const gltf = await this.loadGLB( modelPath );
        let skinnedMesh;
        gltf.scene.traverse( node => { 
            if (node instanceof THREE.SkinnedMesh) 
                skinnedMesh = node; 
        } );

        // 生成实例化对象
        const instanceGroup = new InstancedGroup(
            count,
            skinnedMesh,
            animations,
            texturePath,
            textureCount,
            this.camera
        );

        // 设置人群随机化参数
        const mesh = await instanceGroup.init();
        // for (let i = 0; i < count; i++) {
        //     instanceGroup.setRotation( i, [Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2] ) // 使Avatar面向前方
        //     instanceGroup.setScale( i, [0.1,0.1,0.1] );
        // }
        this.obj.add( mesh );

        return instanceGroup;

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