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
            config: { // 3级LOD
                male: { // 男性模型
                    maxCount: [ 55, 370, 3500 ], // 每级LOD的instance数量
                    availableIndices: [ ],
                    textureCount: 17, // 材质贴图数量
                    animationCount: 3, // 动作数量
                },
                female: {
                    maxCount: [ 55, 370, 3500 ],
                    availableIndices: [ ],
                    textureCount: 18,
                    animationCount: 3,
                }
            },
            instanceGroup: {
                male: [],
                female: []
            }
        };

        for (let i = 0; i < 3; i++) {
            this.manager.config.male.availableIndices.push( range( this.manager.config.male.maxCount[i] ) );
            this.manager.config.female.availableIndices.push( range( this.manager.config.female.maxCount[i] ) );
        }
        
        function range( count ) {
            return new Array( count ).fill( 0 ).map( (v, i) => i );
        }

    }

    async init() {

        this.createHost();
        this.initAvatarParams();
        await this.createMaleAvatar();
        await this.createFemaleAvatar();
        this.created = true;

    }

    updateLOD() {

        let lod = this.lodController.update();
        for (let i = 0; i < lod.length; i++) {
            if (lod[i] != this.manager.params[i].LOD) {
                
                let param = this.manager.params[i];
                this.unsetInstanceParam( param );
                param.LOD = lod[i];
                this.setInstanceParam( param );

            }
            this.manager.instanceGroup.male.forEach( v => v.update() );
            this.manager.instanceGroup.female.forEach( v => v.update() );
        }

    }

    unsetInstanceParam( param ) {

        if ( param.index == -1 || param.LOD == -1 ) return; // LOD为-1表示在视锥外

        const instanceGroup = this.manager.instanceGroup[param.sex][param.LOD];
        instanceGroup.reset( param.index );

        // 释放此index
        this.manager.config[param.sex].availableIndices[param.LOD].push( param.index );
        
    }

    setInstanceParam( param ) {

        if ( param.LOD == -1 ) return; // LOD为-1表示在视锥外

        // 占有一个可用index
        param.index = this.manager.config[param.sex].availableIndices[param.LOD].pop();
        if ( param.index == undefined ){
            console.log(`LOD:${param.LOD}的instance数量设置不足!`); // instances个数不足
        }
        // 人物旋转参数设置
        let rotation = [Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2];
        if ( param.LOD == 2 ) rotation = [Math.PI / 2, 0, 3 * Math.PI / 2];

        const instanceGroup = this.manager.instanceGroup[param.sex][param.LOD];
        instanceGroup.setAnimation( param.index, param.animationType );
        instanceGroup.setSpeed( param.index, param.animationSpeed );
        instanceGroup.setTexture( param.index, param.textureType );
        instanceGroup.setRotation( param.index, rotation ) // 使Avatar面向前方
        instanceGroup.setPosition( param.index, param.position );
        instanceGroup.setScale( param.index, param.scale );

    }

    createHost() {

    }

    initAvatarParams() {

        const positionBias = [ 1.6, 1.2, 0 ]; // 微调人物位置
        for (let i = 0; i < this.seatPositions.length; i++) {
            let param = {
                position: vecAdd( this.seatPositions[i], positionBias ),
                scale: [ 2.6, 2.6, 2.6 ],
                animationSpeed: 0.4 + Math.random() * 0.2,
                LOD: -1,
                index: -1
            }
            if (Math.random() < 0.5) { // 以0.5的概率生成男性
                param.textureType = Math.floor( Math.random() * this.manager.config.male.textureCount );
                param.animationType = Math.floor( Math.random() * this.manager.config.male.animationCount );
                param.sex = "male";
            }
            else { // 以0.5的概率生成女性
                param.textureType = Math.floor( Math.random() * this.manager.config.female.textureCount );
                param.animationType = Math.floor( Math.random() * this.manager.config.female.animationCount );
                param.sex = "female";
            }
            this.manager.params.push( param );
        }

        function vecAdd( a, b ) {
            return [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
        }

    }

    async createMaleAvatar() {

        // 资源路径设置
        const highModelPath = "assets/model/avatar/male_high.glb";
        const highAnimationPath = "assets/animation/male_high_animations.json";
        const highTexturePath = "assets/texture/maleTextureHigh.jpg";
        const highFragmentShader = "shader/highFragmentShader.frag";

        const mediumModelPath = "assets/model/avatar/male_medium.glb";
        const mediumAnimationPath = "assets/animation/male_medium_animations.json";
        const mediumTexturePath = "assets/texture/maleTextureMedium.jpg";
        const mediumFragmentShader = "shader/mediumFragmentShader.frag";

        const lowModelPath = "assets/model/avatar/male_low.glb";
        const lowTexturePath = "assets/texture/maleTextureLow.jpg";
        const lowFragmentShader = "shader/lowFragmentShader.frag";

        // load
        const highModel = await this.loadGLB( highModelPath );
        const mediumModel = await this.loadGLB( mediumModelPath );
        const lowModel = await this.loadGLB( lowModelPath );

        const highMesh = highModel.scene.children[0].children[1];
        const mediumMesh = mediumModel.scene.children[0].children[1];
        const lowMesh = lowModel.scene.children[0];

        // InstanceGroup
        // high
        const highInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[0],
            highMesh,
            highAnimationPath,
            highTexturePath,
            this.manager.config.male.textureCount,
            this.camera
        );
        highInstanceGroup.fragURL = highFragmentShader;
        this.manager.instanceGroup.male.push( highInstanceGroup );
        const highInstanceMesh = await highInstanceGroup.init();
        this.obj.add( highInstanceMesh );

        // medium
        const mediumInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[1],
            mediumMesh,
            mediumAnimationPath,
            mediumTexturePath,
            this.manager.config.male.textureCount,
            this.camera
        );
        mediumInstanceGroup.fragURL = mediumFragmentShader;
        this.manager.instanceGroup.male.push( mediumInstanceGroup );
        const mediumInstanceMesh = await mediumInstanceGroup.init();
        this.obj.add( mediumInstanceMesh );

        // low
        const lowInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[2],
            lowMesh,
            false,
            lowTexturePath,
            this.manager.config.male.textureCount,
            this.camera
        );
        mediumInstanceGroup.fragURL = mediumFragmentShader;
        this.manager.instanceGroup.male.push( lowInstanceGroup );
        const lowInstanceMesh = await lowInstanceGroup.init();
        this.obj.add( lowInstanceMesh );

    }

    async createFemaleAvatar() {

        // 资源路径设置
        const highModelPath = "assets/model/avatar/female_high.glb";
        const highAnimationPath = "assets/animation/female_high_animations.json";
        const highTexturePath = "assets/texture/femaleTextureHigh.jpg";
        const highFragmentShader = "shader/highFragmentShader.frag";

        const mediumModelPath = "assets/model/avatar/female_medium.glb";
        const mediumAnimationPath = "assets/animation/female_medium_animations.json";
        const mediumTexturePath = "assets/texture/femaleTextureMedium.jpg";
        const mediumFragmentShader = "shader/mediumFragmentShader.frag";

        const lowModelPath = "assets/model/avatar/female_low.glb";
        const lowTexturePath = "assets/texture/femaleTextureHigh.jpg";
        const lowFragmentShader = "shader/lowFragmentShader.frag";

        // load
        const highModel = await this.loadGLB( highModelPath );
        const mediumModel = await this.loadGLB( mediumModelPath );
        const lowModel = await this.loadGLB( lowModelPath );

        const highMesh = highModel.scene.children[0].children[1].children[0];
        const mediumMesh = mediumModel.scene.children[0].children[1].children[0];
        const lowMesh = lowModel.scene.children[0];

        // InstanceGroup
        // high
        const highInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[0],
            highMesh,
            highAnimationPath,
            highTexturePath,
            this.manager.config.female.textureCount,
            this.camera
        );
        highInstanceGroup.fragURL = highFragmentShader;
        this.manager.instanceGroup.female.push( highInstanceGroup );
        const highInstanceMesh = await highInstanceGroup.init();
        this.obj.add( highInstanceMesh );

        // medium
        const mediumInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[1],
            mediumMesh,
            mediumAnimationPath,
            mediumTexturePath,
            this.manager.config.female.textureCount,
            this.camera
        );
        mediumInstanceGroup.fragURL = mediumFragmentShader;
        this.manager.instanceGroup.female.push( mediumInstanceGroup );
        const mediumInstanceMesh = await mediumInstanceGroup.init();
        this.obj.add( mediumInstanceMesh );

        // low
        const lowInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[2],
            lowMesh,
            false,
            lowTexturePath,
            this.manager.config.female.textureCount,
            this.camera
        );
        lowInstanceGroup.fragURL = lowFragmentShader;
        this.manager.instanceGroup.female.push( lowInstanceGroup );
        const lowInstanceMesh = await lowInstanceGroup.init();
        this.obj.add( lowInstanceMesh );

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