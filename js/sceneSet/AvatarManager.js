import { InstancedGroup } from "../lib/instancedLib/InstancedGroup.js";
import { LODController } from "../lib/instancedLib/LODController.js";

class AvatarManager {

    constructor( seatPositions, camera ) {
        
        this.obj = new THREE.Object3D();

        const positionBias = [ 1.9, 1.4, 0 ]; // 微调人物位置
        this.seatPositions = seatPositions.map( x => vecAdd(x, positionBias));

        this.camera = camera;
        this.lodController = new LODController( seatPositions, camera );
        this.lodFinished = [false, false, false];

        this.manager = {
            params: [],
            config: { // 3级LOD
                male: { // 男性模型
                    maxCount: [ 60, 500, 3500 ], // 每级LOD的instance数量
                    textureCount: 17, // 材质贴图数量
                    animationCount: 5, // 动作数量
                    body: { // body
                        head: [
                            0.5322, 0.70654296875,
                            1, 1
                        ],
                        hand: [
                            0.20703125, 0.41259765625,
                            0.7275390625, 0.57958984375
                        ],
                        bottom: [
                            0, 0.6, 
                            0.5322, 1
                        ]
                    },
                },
                female: {
                    maxCount: [ 60, 500, 3500 ],
                    textureCount: 18,
                    animationCount: 5,
                    body: { // body
                        head: [
                            0.5322, 0.70654296875,
                            1, 1
                        ],
                        hand: [
                            0.20703125, 0.41259765625,
                            0.7275390625, 0.57958984375
                        ],
                        bottom: [
                            0, 0.6, 
                            0.5322, 1
                        ]
                    },
                }
            },
            instanceGroup: {
                male: new Array(3), // 3级LOD
                female: new Array(3)
            }
        };
        
        function range( count ) {
            return new Array( count ).fill( 0 ).map( (v, i) => i );
        }

        function vecAdd( a, b ) {
            return [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
        }

    }

    initFilePath() {

        return {
            shader: {
                highVertexShader: "shader/highVertexShader.vert",
                highFragmentShader: "shader/highFragmentShader.frag",
                mediumVertexShader: "shader/mediumVertexShader.vert",
                mediumFragmentShader: "shader/mediumFragmentShader.frag",
                lowVertexShader: "shader/lowVertexShader.vert",
                lowFragmentShader: "shader/lowFragmentShader.frag",
            },

            male: {
                // 资源路径设置
                highModelPath: "assets/model/avatar/male_high.glb",
                highAnimationPath: "assets/animation/male_high_animations_long.json",
                highTexturePath: "assets/texture/maleTextureHigh.jpg",

                mediumModelPath: "assets/model/avatar/male_medium.glb",
                mediumAnimationPath: "assets/animation/male_medium_animations_long.json",
                mediumTexturePath: "assets/texture/maleTextureMedium.jpg",

                lowModelPath: "assets/model/avatar/male_low.glb",
                lowTexturePath: "assets/texture/maleTextureLow.jpg",
            },

            female: {
                highModelPath: "assets/model/avatar/female_high.glb",
                highAnimationPath: "assets/animation/female_high_animations_long.json",
                highTexturePath: "assets/texture/femaleTextureHigh.jpg",

                mediumModelPath: "assets/model/avatar/female_medium.glb",
                mediumAnimationPath: "assets/animation/female_medium_animations_long.json",
                mediumTexturePath: "assets/texture/femaleTextureMedium.jpg",

                lowModelPath: "assets/model/avatar/female_low.glb",
                lowTexturePath: "assets/texture/femaleTextureLow.jpg",
            }
        }

    }

    initAvatarParams() {

        for (let i = 0; i < this.seatPositions.length; i++) {
            let param = {
                position: this.seatPositions[i],
                scale: [ 2.6, 2.6, 2.6 ],
                animationSpeed: 4 + Math.random() * 1,
                LOD: -1,
                textureType: [0, 0, 0, 0],
                animationType: 0,
                bodyScale: [
                    1,
                    0.9 + 0.2 * Math.random(),
                    0.9 + 0.2 * Math.random(),
                    0.9 + 0.2 * Math.random()
                ]
            }
            if (Math.random() < 0.5) { // 以0.5的概率生成男性
                param.animationType = Math.floor( Math.random() * this.manager.config.male.animationCount );
                param.textureType = [
                    Math.floor( Math.random() * this.manager.config.male.textureCount ),
                    Math.floor( Math.random() * this.manager.config.male.textureCount ),
                    Math.floor( Math.random() * this.manager.config.male.textureCount ),
                    Math.floor( Math.random() * this.manager.config.male.textureCount )
                ];
                param.sex = "male";
            }
            else { // 以0.5的概率生成女性
                param.animationType = Math.floor( Math.random() * this.manager.config.female.animationCount );
                param.textureType = [
                    Math.floor( Math.random() * this.manager.config.female.textureCount ),
                    Math.floor( Math.random() * this.manager.config.female.textureCount ),
                    Math.floor( Math.random() * this.manager.config.female.textureCount ),
                    Math.floor( Math.random() * this.manager.config.female.textureCount )
                ];
                param.sex = "female";
            }
            this.manager.params.push( param );
        }

    }

    async init() {

        this.createHost();
        this.initAvatarParams();
        console.log(this.computeDisp());
        const filePath = this.initFilePath();
        await this.createLowAvatar(filePath);
        await this.createMediumAvatar(filePath);
        await this.createHighAvatar(filePath);

    }

    computeDisp() {

        console.log(this.manager.params);
        return 1;

    }

    updateLOD() {
        
        if ( !this.lodFinished[2] ) return;

        const minFinishedLOD = this.lodFinished[1] ? (this.lodFinished[0] ? 0 : 1) : 2;
        const lod = this.lodController.update();
        let lodCount = {
            male: [0, 0, 0],
            female: [0, 0, 0]
        };
        for (let i = 0; i < lod.length; i++) {
            if (lod[i] != -1) {
                
                let param = this.manager.params[i];
                param.LOD = Math.max(lod[i], minFinishedLOD);
                param.index = lodCount[param.sex][param.LOD]++;
                this.setInstanceParam( param );
                
            }
        }
        
        this.manager.instanceGroup.male.forEach( (group, i) => {
            if (lodCount.male[i] > this.manager.config.male.maxCount[i])
                console.warn(`Male LOD:${i}的instance数量设置不足!`); // instances个数不足
            group.mesh.count = lodCount.male[i];
            group.update();
        } );
        this.manager.instanceGroup.female.forEach( (group, i) => {
            if (lodCount.female[i] > this.manager.config.female.maxCount[i])
                console.warn(`Female LOD:${i}的instance数量设置不足!`); // instances个数不足
            group.mesh.count = lodCount.female[i];
            group.update();
        } );

    }

    setInstanceParam( param ) {

        if ( param.LOD == -1 ) return; // LOD为-1表示在视锥外

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
        instanceGroup.setBodyScale( param.index, param.bodyScale );

    }

    createHost() {

    }

    async createLowAvatar(path) {

        // male
        const maleModel = await this.loadGLB( path.male.lowModelPath );
        const maleMesh = maleModel.scene.children[0];

        const maleInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[2],
            maleMesh,
            false,
            path.male.lowTexturePath,
            this.manager.config.male.textureCount,
            this.camera
        );
        maleInstanceGroup.vertURL = path.shader.lowVertexShader;
        maleInstanceGroup.fragURL = path.shader.lowFragmentShader;

        const maleInstanceMesh = await maleInstanceGroup.init();
        this.manager.instanceGroup.male[2] = maleInstanceGroup;
        this.obj.add( maleInstanceMesh );

        // female
        const femaleModel = await this.loadGLB( path.female.lowModelPath );
        const femaleMesh = femaleModel.scene.children[0];

        const femaleInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[2],
            femaleMesh,
            false,
            path.female.lowTexturePath,
            this.manager.config.female.textureCount,
            this.camera
        );
        femaleInstanceGroup.vertURL = path.shader.lowVertexShader;
        femaleInstanceGroup.fragURL = path.shader.lowFragmentShader;

        const femaleInstanceMesh = await femaleInstanceGroup.init();
        this.manager.instanceGroup.female[2] = femaleInstanceGroup;
        this.obj.add( femaleInstanceMesh );

        this.lodFinished[2] = true;

    }

    async createMediumAvatar(path) {

        // male
        const maleModel = await this.loadGLB( path.male.mediumModelPath );
        const maleMesh = maleModel.scene.children[0].children[1];

        const maleInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[1],
            maleMesh,
            path.male.mediumAnimationPath,
            path.male.mediumTexturePath,
            this.manager.config.male.textureCount,
            this.camera
        );
        maleInstanceGroup.body = this.manager.config.male.body;
        maleInstanceGroup.vertURL = path.shader.mediumVertexShader;
        maleInstanceGroup.fragURL = path.shader.mediumFragmentShader;

        const maleInstanceMesh = await maleInstanceGroup.init();
        this.manager.instanceGroup.male[1] = maleInstanceGroup;
        this.obj.add( maleInstanceMesh );

        // female
        const femaleModel = await this.loadGLB( path.female.mediumModelPath );
        const femaleMesh = femaleModel.scene.children[0].children[1].children[0];

        const femaleInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[1],
            femaleMesh,
            path.female.mediumAnimationPath,
            path.female.mediumTexturePath,
            this.manager.config.female.textureCount,
            this.camera
        );
        femaleInstanceGroup.body = this.manager.config.female.body;
        femaleInstanceGroup.vertURL = path.shader.mediumVertexShader;
        femaleInstanceGroup.fragURL = path.shader.mediumFragmentShader;

        const femaleInstanceMesh = await femaleInstanceGroup.init();
        this.manager.instanceGroup.female[1] = femaleInstanceGroup;
        this.obj.add( femaleInstanceMesh );

        this.lodFinished[1] = true;

    }

    async createHighAvatar(path) {

        // male
        const maleModel = await this.loadGLB( path.male.highModelPath );
        const maleMesh = maleModel.scene.children[0].children[1];

        const maleInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[0],
            maleMesh,
            path.male.highAnimationPath,
            path.male.highTexturePath,
            this.manager.config.male.textureCount,
            this.camera
        );
        maleInstanceGroup.body = this.manager.config.male.body;
        maleInstanceGroup.vertURL = path.shader.highVertexShader;
        maleInstanceGroup.fragURL = path.shader.highFragmentShader;

        const maleInstanceMesh = await maleInstanceGroup.init();
        this.manager.instanceGroup.male[0] = maleInstanceGroup;
        this.obj.add( maleInstanceMesh );

        // female
        const femaleModel = await this.loadGLB( path.female.highModelPath );
        const femaleMesh = femaleModel.scene.children[0].children[1].children[0];

        const femaleInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[0],
            femaleMesh,
            path.female.highAnimationPath,
            path.female.highTexturePath,
            this.manager.config.female.textureCount,
            this.camera
        );
        femaleInstanceGroup.body = this.manager.config.female.body;
        femaleInstanceGroup.vertURL = path.shader.highVertexShader;
        femaleInstanceGroup.fragURL = path.shader.highFragmentShader;

        const femaleInstanceMesh = await femaleInstanceGroup.init();
        this.manager.instanceGroup.female[0] = femaleInstanceGroup;
        this.obj.add( femaleInstanceMesh );

        this.lodFinished[0] = true;

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