import { InstancedGroup } from "../lib/instancedLib/InstancedGroup.js";
import { LODController } from "./LODController.js";

class AvatarManager {

    constructor( seatPositions, camera ) {
        
        this.avatar = new THREE.Object3D();

        const positionBias = [ 1.9, 1.4, 0 ]; // 微调人物位置
        this.seatPositions = seatPositions.map( x => vecAdd(x, positionBias));

        this.camera = camera;
        this.clock = new THREE.Clock();
        this.lodController = new LODController( seatPositions, camera );
        this.lodFinished = [false, false, false];
        this.filePath;

        this.manager = {
            params: [],
            config: { // 3级LOD
                animationFrameCount: 25,
                male: { // 男性模型
                    maxCount: [ 60, 500, 3500 ], // 每级LOD的instance数量
                    textureCount: 17, // 材质贴图数量
                    animationCount: 18, // 动作数量
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
                    animationCount: 17,
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
            },
            host: {
                audio: null,
                mixer: new Array(7),
                cb: null
            }
        };

        function vecAdd( a, b ) {
            return [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
        }

    }

    async init() {

        this.psnr = await this.loadJSON("assets/PSNR.json"); // 峰值信噪比
        this.initFilePath();
        this.initAvatarParams();
        this.adjustParam();
        this.computeDisp();

    }

    initFilePath() {

        this.filePath = {

            host: {
                voice: "assets/model/host/voice_long.mp3",
                model: "assets/model/host/host.glb"
            },

            shader: {
                highVertexShader: "shader/highVertexShader.vert",
                highFragmentShader: "shader/highFragmentShader.frag",
                mediumVertexShader: "shader/mediumVertexShader.vert",
                mediumFragmentShader: "shader/mediumFragmentShader.frag",
                lowVertexShader: "shader/lowVertexShader.vert",
                lowFragmentShader: "shader/lowFragmentShader.frag",
            },

            male: {
                lightMapPath: "assets/lightmap/Lightmap_Male.jpg",

                highModelPath: "assets/model/avatar/male_high_new.glb",
                highAnimationPath: "assets/animation/male_high_animations_new.json",
                highTexturePath: "assets/texture/maleTextureHigh.jpg",

                mediumModelPath: "assets/model/avatar/male_medium_new.glb",
                mediumAnimationPath: "assets/animation/male_medium_animations_new.json",
                mediumTexturePath: "assets/texture/maleTextureMedium.jpg",

                lowModelPath: "assets/model/avatar/male_low.glb",
                lowTexturePath: "assets/texture/maleTextureLow.jpg",
            },

            female: {
                lightMapPath: "assets/lightmap/Lightmap_Female.jpg",

                highModelPath: "assets/model/avatar/female_high_new.glb",
                highAnimationPath: "assets/animation/female_high_animations_new.json",
                highTexturePath: "assets/texture/femaleTextureHigh.jpg",

                mediumModelPath: "assets/model/avatar/female_medium_new.glb",
                mediumAnimationPath: "assets/animation/female_medium_animations_new.json",
                mediumTexturePath: "assets/texture/femaleTextureMedium.jpg",

                lowModelPath: "assets/model/avatar/female_low.glb",
                lowTexturePath: "assets/texture/femaleTextureLow.jpg",
            }

        };

    }

    initAvatarParams() {

        let time = this.clock.getElapsedTime();
        for (let i = 0; i < this.seatPositions.length; i++) {
            let param = {
                position: this.seatPositions[i],
                scale: [ 2.6, 2.6, 2.6 ],
                animationSpeed: 10,
                LOD: -1,
                textureType: [0, 0, 0, 0],
                animationType: 0,
                animationStartTime: 0,
                animationEndTime: 0,
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

    adjustParam() {

        for (let i = 0; i < this.manager.params.length; i++) {
            let param = this.manager.params[i]
            if (param.sex == "male") {
                if (param.textureType[0] == 6 || param.textureType[0] == 11 || param.textureType[0] == 13) param.textureType[0]--; // 去掉短袖短裤
                if (param.textureType[2] == 13) param.textureType[2]--;
            }
            else if (param.sex == "female") {
                if (param.textureType[0] == 14) param.textureType[0]--; // 去掉短袖短裤
                if (param.textureType[2] == 3 || param.textureType[2] == 4 || param.textureType[2] == 7 || param.textureType[2] == 8) param.textureType[2]--;
            }
        }

    }

    setAvatarAnimation( param, time ) {

        if (time > param.animationEndTime) {
            let delta;
            if (Math.random() < 0.8) { // 0.8的概率静止
                param.animationType = 0;
                delta = (Math.floor(Math.random() * 50) + 15) / param.animationSpeed;
            }
            else {
                param.animationType = Math.floor( Math.random() * this.manager.config[param.sex].animationCount ) + 1;
                if (param.sex == "male" && (param.animationType == 7 || param.animationType == 1)) param.animationType = 2; // 去掉第七个动作
                delta = this.manager.config.animationFrameCount / (1.2 * param.animationSpeed);
            }
            param.animationStartTime = time;
            param.animationEndTime = time + delta;
        }

    }

    initAvatarParamsGreedly() {

        const rowNum = [24, 34, 28], col = 26;
        for (let l = 0; l < rowNum.length; l++) {
            const row = rowNum[l];
            for (let k = 0; k < 3; k++) {
                let bais = k * row * col;
                for (let p = 0; p < l; p++) {
                    bais += rowNum[p] * col * 3;                 
                }
                let genId =  (x, y) => {
                    return bais + x * col + y;
                };
                for (let i = 0; i < row; i++) {
                    for (let j = 0; j < col; j++) {
                        const id = genId(i,j);
                        let islegal=(x,y) => {
                            if (x < 26 && x >= 0 && y < row && y >= 0) return true;
                            else return false;
                        };
                        let param = {
                            position: this.seatPositions[id],
                            scale: [ 2.6, 2.6, 2.6 ],
                            animationSpeed: 10,
                            LOD: -1,
                            textureType: [0, 0, 0, 0],
                            animationType: 0,
                            animationStartTime: 0,
                            animationEndTime: 0,
                            bodyScale: [
                                1,
                                0.9 + 0.2 * Math.random(),
                                0.9 + 0.2 * Math.random(),
                                0.9 + 0.2 * Math.random()
                            ]
                        }
                        let candidate = [];
                        if (islegal(i - 1, j)) candidate.push(genId(i - 1, j));
                        if (islegal(i - 1, j - 1)) candidate.push(genId(i - 1, j - 1));
                        if (islegal(i - 1, j + 1)) candidate.push(genId(i - 1, j + 1));
                        if (islegal(i, j - 1)) candidate.push(genId(i, j - 1));
                        let comp =  (a, b) => {
                            let x = a, y = b;
                            let suma = 0,
                                sumb = 0;
                            for (let t = 0; t < candidate.length; t++) {
                                const element = candidate[t];
                                let temp = this.manager.params[element];
                                suma += this.computePSNR(temp, x);
                                sumb += this.computePSNR(temp, y)
                            }
                            if (suma < sumb) return 1;
                            if (suma > sumb) return -1;
                            return 0;
                        };
                        if (Math.random() < 0.5) { // 以0.5的概率生成男性
                            param.animationType = Math.floor(Math.random() * this.manager.config.male.animationCount);
                            param.textureType = [
                                Math.floor(Math.random() * this.manager.config.male.textureCount),
                                Math.floor(Math.random() * this.manager.config.male.textureCount),
                                Math.floor(Math.random() * this.manager.config.male.textureCount),
                                Math.floor(Math.random() * this.manager.config.male.textureCount)
                            ];
                            param.sex = "male";
                            if (candidate.length>0) {
                                let toSort = [];
                                for (let index = 0; index < this.manager.config.male.textureCount; index++) {
                                    let tmp = { position: [], textureType: [0, 0, 0, 0] };
                                    tmp.position = param.position;
                                    tmp.textureType[0] = index;
                                    toSort.push(tmp);
                                }
                                toSort.sort(comp);
                                param.textureType[0] =
                                    toSort[Math.floor(Math.random() * 3)].textureType[0];
                            }
                        } else { // 以0.5的概率生成女性
                            param.animationType = Math.floor(Math.random() * this.manager.config.female.animationCount);
                            param.textureType = [
                                Math.floor(Math.random() * this.manager.config.female.textureCount),
                                Math.floor(Math.random() * this.manager.config.female.textureCount),
                                Math.floor(Math.random() * this.manager.config.female.textureCount),
                                Math.floor(Math.random() * this.manager.config.female.textureCount)
                            ];
                            param.sex = "female";
                            if (candidate.length) {
                                let toSort = [];
                                for (let index = 0; index < this.manager.config.female.textureCount; index++) {
                                    let tmp = { position: [], textureType: [0, 0, 0, 0] };
                                    tmp.position = param.position;
                                    tmp.textureType[0] = index;
                                    toSort.push(tmp);
                                }
                                toSort.sort(comp);
                                param.textureType[0] =
                                    toSort[Math.floor(Math.random() * 3)].textureType[0];
                            }
                        }
                        this.manager.params.push( param );
                    }
                }
            }
        }
        
    }

    computeDisp() {

       // 峰值信噪比差异
       let texSum = 0;
       for (let i = 0; i < this.seatPositions.length; i++) {
           for (let j = i+1; j < this.seatPositions.length; j++) {
               texSum += this.computePSNR(this.manager.params[i], this.manager.params[j]);
           }
       }
       console.log("diff_texture: ", texSum);

       // 局部差异
       let localSum = 0;
       for (let i = 0; i < this.seatPositions.length; i++) {
           for (let j = i + 1; j < this.seatPositions.length; j++) {
               localSum += this.computeLocal(this.manager.params[i], this.manager.params[j]);
           }
       }
       console.log("diff_local: ", localSum);

    }

    computePSNR(ava1, ava2) {

        let diff = 0, id1, id2;
        if (ava1.sex == "male") id1 = ava1.textureType[0];
        else id1 = ava1.textureType[0] + this.manager.config.male.textureCount;
        if (ava2.sex == "male") id2 = ava2.textureType[0];
        else id2 = ava2.textureType[0] + this.manager.config.male.textureCount;
        diff = this.psnr[id1][id2];
        // 两人物距离
        let vec = [
            ava1.position[0] - ava2.position[0], 
            ava1.position[1] - ava2.position[1], 
            ava1.position[2] - ava2.position[2]
        ];
        return 2 * diff / (Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]) *
            (this.seatPositions.length - 1) * this.seatPositions.length);

    }

    computeLocal(ava1, ava2) {

        let diff = 0;
        for (let k = 1; k < 4; k++) { //三个部位
            diff += Math.abs(ava1.bodyScale[k] - ava2.bodyScale[k]);
        }
        let vec = [
            ava1.position[0] - ava2.position[0],
            ava1.position[1] - ava2.position[1],
            ava1.position[2] - ava2.position[2]
        ];
        return 2 * diff / (Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]) *
            (this.seatPositions.length - 1) * this.seatPositions.length);

    }

    updateLOD() {
        
        if ( !this.lodFinished[2] ) return;

        const minFinishedLOD = this.lodFinished[1] ? (this.lodFinished[0] ? 0 : 1) : 2;
        const lod = this.lodController.update();
        let lodCount = {
            male: [0, 0, 0],
            female: [0, 0, 0]
        };
        let time = this.clock.getElapsedTime();
        for (let i = 0; i < lod.length; i++) {
            let param = this.manager.params[i];
            this.setAvatarAnimation( param, time );
            if (lod[i] != -1) {
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

        return [
            lodCount.male[0] + lodCount.female[0],
            lodCount.male[1] + lodCount.female[1],
            lodCount.male[2] + lodCount.female[2]
        ];

    }

    setInstanceParam( param ) {

        if ( param.LOD == -1 ) return; // LOD为-1表示在视锥外

        // 人物旋转参数设置
        let rotation = [Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2];
        if ( param.LOD == 2 ) rotation = [Math.PI / 2, 0, 3 * Math.PI / 2];

        const instanceGroup = this.manager.instanceGroup[param.sex][param.LOD];
        instanceGroup.setAnimation( param.index, param.animationType, param.animationStartTime );
        instanceGroup.setSpeed( param.index, param.animationSpeed );
        instanceGroup.setTexture( param.index, param.textureType );
        instanceGroup.setRotation( param.index, rotation ) // 使Avatar面向前方
        instanceGroup.setPosition( param.index, param.position );
        instanceGroup.setScale( param.index, param.scale );
        instanceGroup.setBodyScale( param.index, param.bodyScale );

    }

    async initHost() {

        // 音频初始化
        let audioBuffer = await this.loadAudio( this.filePath.host.voice );
        const listener = new THREE.AudioListener();
        this.camera.add( listener );
        this.manager.host.audio = new THREE.Audio( listener );
        this.manager.host.audio.setBuffer( audioBuffer );

        // host 模型
        const gltf = await this.loadGLB( this.filePath.host.model );
        let model = gltf.scene;
        this.avatar.add( model );
        model.position.set( 198, 9, -65 );
        model.rotation.set( Math.PI, Math.PI / 2, 0 );
        model.scale.set( 10, 10, 10 );
        model.traverse( node => {
            if ( node instanceof THREE.SkinnedMesh ) {
                node.material.side = THREE.DoubleSide;
                node.frustumCulled = false;
            }
        });

        // 将模型绑定到动画混合器里面
        let anima = gltf.animations;
        this.manager.host.mixer[0] = new THREE.AnimationMixer( model );
        this.manager.host.mixer[1] = new THREE.AnimationMixer( model );
        this.manager.host.mixer[2] = new THREE.AnimationMixer( model );
        this.manager.host.mixer[3] = new THREE.AnimationMixer( model );
        this.manager.host.mixer[4] = new THREE.AnimationMixer( model );
        this.manager.host.mixer[5] = new THREE.AnimationMixer( model );
        this.manager.host.mixer[6] = new THREE.AnimationMixer( model );
        // 同时将这个外部模型的动画全部绑定到动画混合器里面
        this.manager.host.mixer[0].clipAction(anima[5]).play(); // b
        this.manager.host.mixer[1].clipAction(anima[7]).play(); // d
        this.manager.host.mixer[2].clipAction(anima[3]).play(); // a
        this.manager.host.mixer[3].clipAction(anima[6]).play(); // e
        this.manager.host.mixer[4].clipAction(anima[10]).play(); // u
        this.manager.host.mixer[5].clipAction(anima[1]).play(); // static
        this.manager.host.mixer[6].clipAction(anima[0]).play(); // static

    }

    playAudio() {

        let scope = this;
        let orderList = [1, 2, 3, 3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 0, 3, 1, 2, 1, 4, 0, 3, 1, 2, 1, 4, 0, 3, 1, 2, 1, 4];
        let timeList = 3845;
        let moveNum = orderList.length; // 面部动作数量
        let moveTime = timeList / moveNum; // 每个动作的时间
        let upda = 0;
        let pastTime = 0; // 第一次播放时, 音频会相对动画延迟
        let clock = new THREE.Clock();

        let boneArm = [];
        let boneFace = [];
        for (let i = 70; i < 120; i++) boneFace.push(i);
        for (let i = 0; i < 216; i++) boneArm.push(i);

        this.manager.host.audio.play();
        animate();

        function animate() {
            if ( scope.manager.host.audio.isPlaying ) {
                upda = getUpda();
                scope.manager.host.mixer[5].update( 0.01, boneArm ); // 手臂
                scope.manager.host.mixer[upda].update( 0.019, boneFace ); // 口型
                pastTime += clock.getDelta() * 1000;
                requestAnimationFrame( animate );
            }
            else {
                scope.manager.host.mixer[6].update( 0.01 );
                if ( scope.manager.host.cb ) scope.manager.host.cb();
            }
        }

        function getUpda() {
            let n = parseInt( pastTime / moveTime );
            if ( n < moveNum ) upda = orderList[n];
            else upda = orderList[moveNum - 1] // 播放过慢
            return upda;
        }

    }

    async createLowAvatar() {

        // male
        const maleModel = await this.loadGLB( this.filePath.male.lowModelPath );
        const maleMesh = maleModel.scene.children[0];

        const maleInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[2],
            maleMesh,
            false,
            this.filePath.male.lowTexturePath,
            false,
            this.manager.config.male.textureCount,
            this.camera,
            this.clock
        );
        maleInstanceGroup.vertURL = this.filePath.shader.lowVertexShader;
        maleInstanceGroup.fragURL = this.filePath.shader.lowFragmentShader;

        const maleInstanceMesh = await maleInstanceGroup.init();
        this.manager.instanceGroup.male[2] = maleInstanceGroup;
        this.avatar.add( maleInstanceMesh );

        // female
        const femaleModel = await this.loadGLB( this.filePath.female.lowModelPath );
        const femaleMesh = femaleModel.scene.children[0];

        const femaleInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[2],
            femaleMesh,
            false,
            this.filePath.female.lowTexturePath,
            false,
            this.manager.config.female.textureCount,
            this.camera,
            this.clock
        );
        femaleInstanceGroup.vertURL = this.filePath.shader.lowVertexShader;
        femaleInstanceGroup.fragURL = this.filePath.shader.lowFragmentShader;

        const femaleInstanceMesh = await femaleInstanceGroup.init();
        this.manager.instanceGroup.female[2] = femaleInstanceGroup;
        this.avatar.add( femaleInstanceMesh );

        this.lodFinished[2] = true;

    }

    async createMediumAvatar() {

        // male
        const maleModel = await this.loadGLB( this.filePath.male.mediumModelPath );
        const maleMesh = maleModel.scene.children[0].children[0].children[2];

        const maleInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[1],
            maleMesh,
            this.filePath.male.mediumAnimationPath,
            this.filePath.male.mediumTexturePath,
            this.filePath.male.lightMapPath,
            this.manager.config.male.textureCount,
            this.camera,
            this.clock
        );
        maleInstanceGroup.body = this.manager.config.male.body;
        maleInstanceGroup.vertURL = this.filePath.shader.mediumVertexShader;
        maleInstanceGroup.fragURL = this.filePath.shader.mediumFragmentShader;

        const maleInstanceMesh = await maleInstanceGroup.init();
        this.manager.instanceGroup.male[1] = maleInstanceGroup;
        this.avatar.add( maleInstanceMesh );

        // female
        const femaleModel = await this.loadGLB( this.filePath.female.mediumModelPath );
        const femaleMesh = femaleModel.scene.children[0].children[0].children[2];

        const femaleInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[1],
            femaleMesh,
            this.filePath.female.mediumAnimationPath,
            this.filePath.female.mediumTexturePath,
            this.filePath.female.lightMapPath,
            this.manager.config.female.textureCount,
            this.camera,
            this.clock
        );
        femaleInstanceGroup.body = this.manager.config.female.body;
        femaleInstanceGroup.vertURL = this.filePath.shader.mediumVertexShader;
        femaleInstanceGroup.fragURL = this.filePath.shader.mediumFragmentShader;

        const femaleInstanceMesh = await femaleInstanceGroup.init();
        this.manager.instanceGroup.female[1] = femaleInstanceGroup;
        this.avatar.add( femaleInstanceMesh );

        this.lodFinished[1] = true;

    }

    async createHighAvatar() {

        // male
        const maleModel = await this.loadGLB( this.filePath.male.highModelPath );
        const maleMesh = maleModel.scene.children[0].children[0].children[1];

        const maleInstanceGroup = new InstancedGroup(
            this.manager.config.male.maxCount[0],
            maleMesh,
            this.filePath.male.highAnimationPath,
            this.filePath.male.highTexturePath,
            this.filePath.male.lightMapPath,
            this.manager.config.male.textureCount,
            this.camera,
            this.clock,
        );
        maleInstanceGroup.body = this.manager.config.male.body;
        maleInstanceGroup.vertURL = this.filePath.shader.highVertexShader;
        maleInstanceGroup.fragURL = this.filePath.shader.highFragmentShader;

        const maleInstanceMesh = await maleInstanceGroup.init();
        this.manager.instanceGroup.male[0] = maleInstanceGroup;
        this.avatar.add( maleInstanceMesh );

        // female
        const femaleModel = await this.loadGLB( this.filePath.female.highModelPath );
        const femaleMesh = femaleModel.scene.children[0].children[0].children[2];

        const femaleInstanceGroup = new InstancedGroup(
            this.manager.config.female.maxCount[0],
            femaleMesh,
            this.filePath.female.highAnimationPath,
            this.filePath.female.highTexturePath,
            this.filePath.female.lightMapPath,
            this.manager.config.female.textureCount,
            this.camera,
            this.clock
        );
        femaleInstanceGroup.body = this.manager.config.female.body;
        femaleInstanceGroup.vertURL = this.filePath.shader.highVertexShader;
        femaleInstanceGroup.fragURL = this.filePath.shader.highFragmentShader;

        const femaleInstanceMesh = await femaleInstanceGroup.init();
        this.manager.instanceGroup.female[0] = femaleInstanceGroup;
        this.avatar.add( femaleInstanceMesh );

        this.lodFinished[0] = true;

    }

    loadJSON( path ) {

        return new Promise( (resolve, reject) => { 
            const loader = new THREE.FileLoader();
            loader.load( path, data => {
                const json = JSON.parse( data );
                resolve( json );
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

    loadAudio( path ) {

        return new Promise( (resolve, reject) => {
            new THREE.AudioLoader().load( path, buffer => {
                resolve(buffer);
            });
        });

    }

}

export { AvatarManager };