import { RoomManager } from './room/RoomManager.js';
import { AvatarManager } from './avatar/AvatarManager.js';
import { SeatManager } from './avatar/SeatManager.js';

class Main {

    constructor() {

        this.VR = false;
        this.scene = new THREE.Scene();
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

        this.roomManager = new RoomManager(this.camera);
        this.seatManager = new SeatManager();
        this.avatarManager = new AvatarManager(this.seatManager.positions, this.camera);

        this.scene.add(this.roomManager.room);
        this.scene.add(this.seatManager.chairs);
        this.scene.add(this.avatarManager.avatar);

        // 加载顺序
        await this.roomManager.createDoor(); // 门
        await this.seatManager.create(); // 椅子
        await this.avatarManager.createLowAvatar(); // 人物低模
        await this.roomManager.loadFirstResource(); // 会议室主体
        await this.avatarManager.createMediumAvatar(); // 人物中模
        await this.avatarManager.createHighAvatar(); // 人物高模
        await this.roomManager.loadOtherResource() // 会议室其他

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

        render();

        function render() {
            if( scope.avatarManager ) scope.avatarManager.updateLOD();
            if( scope.VR ) scope.stereoEffect.render(scope.scene, scope.camera);
            else scope.renderer.render(scope.scene, scope.camera);
            if ( window.innerWidth != scope.winWidth || window.innerHeight != scope.winHeight ) onResize();
            requestAnimationFrame( render );
        }

        function onResize() {
            scope.winWidth = window.innerWidth;
            scope.winHeight = window.innerHeight;

            scope.camera.aspect = scope.winWidth / scope.winHeight;
            scope.camera.updateProjectionMatrix();

            scope.renderer.setSize( scope.winWidth, scope.winHeight );
        }

    }
}

export { Main };
