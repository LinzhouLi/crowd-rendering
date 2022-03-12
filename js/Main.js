class Main {

    constructor() {

        this.VR = false;
        this.scene = new THREE.Scene();
        this.camera;
        this.renderer;
        this.stereoEffect;
        this.winWidth = window.innerWidth;
        this.winHeight = window.innerHeight;

        this.initCamera();
        this.initLight();
        this.initRenderer();

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
            if( scope.avatarManager && scope.avatarManager.created && window.update ) scope.avatarManager.updateLOD();
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
