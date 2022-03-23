import { RoomManager } from './room/RoomManager.js';
import { AvatarManager } from './avatar/AvatarManager.js';
import { SeatManager } from './avatar/SeatManager.js';
import { MoveManager } from './lib/playerControl/MoveManager.js';
import { Net } from './room/Net.js';
import { Blur } from './Blur.js';

class Main {

    constructor() {

        this.VR = false;
        this.showFPS = true;
        this.fpsInterval;
        this.scene = new THREE.Scene();
        this.background = new Blur();
        this.camera;
        this.renderer;
        this.stereoEffect;
        this.winWidth = window.innerWidth;
        this.winHeight = window.innerHeight;

        this.roomManager;
        this.seatManager;
        this.avatarManager

        this.initCamera();
        this.initLight();
        this.initRenderer();

    }

    async initScene() {

        let scope = this;

        this.roomManager = new RoomManager(this.camera);
        this.seatManager = new SeatManager();
        this.avatarManager = new AvatarManager(this.seatManager.positions, this.camera);

        this.scene.add(this.roomManager.room);
        this.scene.add(this.seatManager.chairs);
        this.scene.add(this.avatarManager.avatar);

        // 加载顺序
        await this.avatarManager.init();
        await this.roomManager.createDoor(); // 门
        await this.roomManager.loadFirstResource(); // 会议室主体
        this.initCurtain(); // 帘子
        await this.seatManager.create(); // 椅子
        await this.avatarManager.createLowAvatar(); // 人物低模
        await this.avatarManager.createMediumAvatar(); // 人物中模
        await this.avatarManager.initHost(); // 主持人
        await this.avatarManager.createHighAvatar(); // 人物高模

        if ( this.background.started ) manage(); // 开启预览
        else this.background.startFunc = manage;

        await this.roomManager.loadNextResource(); // 会议室其他
        await this.roomManager.loadOtherResource(); // 会议室其他

        function manage() {

            scope.preview();

        }

    }

    preview() {

        let scope = this;
        let movePath = [
            [-155, 41, 22, -1.5572, -1.47875, -1.55714, 80],
            [-119, 39, 24, -0.91, -1.48, -0.91, 80],
            [-59, 48, -14, -1.25, -1.52, -1.24, 80],
            [-122,39,-116,-2.863791,-1.04, -2.8,80],
            [129, 37, -66, -1.25, -1.52, -1.24, 200],

            [186.629944, 26.749136,-64.9026,-1.678751829760329,-1.183107113654890, -1.68733072496894, 50],
            [186.629944, 26.749137,-64.9027,-1.678751829760328,-1.183107113654891, -1.68733072496893, 100],

            [130, 37, -12, -1.25, -1.52, -1.24, 50],
            [129, 37, -27, -1.25, -1.52, -1.24, 50],
            [229, 29, -19, -1.21, 1.46, 1.19, 80],
            [183, 63, -19, -1.67, 1.35, 1.66, 80],

            [77.68, 109.13, -17.50,-1.67, 1.35, 1.66, 50],
            [-30.440306021267492,125.36564291071822,-18.58769506,-1.5921799912480827,  -1.0399661678502943,  -1.5955909248070625, 50]

        ];

        let funcArr = new Array( movePath.length );
        funcArr[3] = function() { scope.avatarManager.playAudio(); }
        funcArr[ movePath.length - 1 ] = function() {
            if ( scope.avatarManager.manager.host.audio.isPlaying ) {
                scope.avatarManager.manager.host.cb = scope.roomManager.playVideo;
            }
            else scope.roomManager.playVideo();
        }
        new MoveManager(this.camera, movePath, funcArr);

    }

    initCurtain() {

        let net = new Net().object;
        net.position.set( 170, 17, -59 )
        net.scale.set( -0.03, 0.03, 0.04 )
        net.rotation.set( 0, Math.PI / 2, 0 )
        this.scene.add( net );

        net = new Net().object;
        net.position.set( 170, 17, 29 )
        net.scale.set( 0.03, 0.03, 0.04 )
        net.rotation.set( 0, Math.PI / 2, 0 )
        this.scene.add( net );

    }

    initCamera() {

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.set( -155 ,41,22, -2.07 );
        this.camera.rotation.set( -1.5572, -1.47875, -1.55714 );

    }

    initLight() {

        const ambientLight = new THREE.AmbientLight( 0xffffff , 1 );
        this.scene.add( ambientLight );

        const pointLight = new THREE.PointLight( 0xffffff, 1 );
        pointLight.position.set( 0, 40.97, 0 );
        pointLight.rotation.set( 0, Math.PI / 2, 0 );

        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 1200;
        pointLight.shadow.camera.far = 2500;
        pointLight.shadow.bias = 0.0001;

        pointLight.shadow.mapSize.width = this.winWidth;
        pointLight.shadow.mapSize.height = this.winHeight;

        this.scene.add( pointLight );

    }

    initRenderer() {

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.winWidth, this.winHeight );
        document.body.appendChild( this.renderer.domElement );

        // this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        if ( this.VR ) this.stereoEffect = new THREE.StereoEffect( this.renderer );

    }

    render() {

        let scope = this;
        let frameIndex = 0, frameIndexPre = 0;
        const tag = document.getElementById("fps");

        render();
        
        if (this.showFPS) this.fpsInterval = setInterval(computeFPS, 1000);

        function render() {
            frameIndex++;
            if( scope.avatarManager ) scope.avatarManager.updateLOD();
            if( scope.VR ) scope.stereoEffect.render(scope.scene, scope.camera);
            else scope.renderer.render(scope.scene, scope.camera);
            if ( window.innerWidth != scope.winWidth || window.innerHeight != scope.winHeight ) onResize();
            requestAnimationFrame( render );
        }

        function computeFPS() {
            tag.innerHTML = (frameIndex - frameIndexPre);
            frameIndexPre = frameIndex;
        }

        function onResize() {
            scope.winWidth = window.innerWidth;
            scope.winHeight = window.innerHeight;

            scope.camera.aspect = scope.winWidth / scope.winHeight;
            scope.camera.updateProjectionMatrix();

            scope.renderer.setSize( scope.winWidth, scope.winHeight );
        }

    }

    stopShowFPS() {

        this.showFPS = false;
        clearInterval(this.fpsInterval);

    }
}

export { Main };
