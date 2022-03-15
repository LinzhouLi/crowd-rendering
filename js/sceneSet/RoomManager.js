import { ResourceLoader } from '../ResourceLoader.js';

class RoomManager{

    constructor (camera) {
        
        this.room = new THREE.Object3D();
        this.room.scale.set(10, 10, 10);
        this.url = "assets/model/room/";
        this.doorUrl = "assets/model/room/door.gltf";
        this.camera = camera;
        this.roomScene;

    }

    async createDoor () {

        const gltf = await this.loadGLB(this.doorUrl);

        let frameGeometry = gltf.scene.children[0].children[0].geometry;
        let glassGeometry = gltf.scene.children[0].children[1].geometry;
        let handleGeometry = gltf.scene.children[0].children[2].geometry;

        let frameMaterial = gltf.scene.children[0].children[0].material;
        let glassMaterial = gltf.scene.children[0].children[1].material;
        let handleMaterial = gltf.scene.children[0].children[2].material;

        let frameMesh = new THREE.InstancedMesh(frameGeometry, frameMaterial, 4); // 门主体
        let glassMesh = new THREE.InstancedMesh(glassGeometry, glassMaterial, 4); // 门上的玻璃
        let mesh2 = new THREE.InstancedMesh(handleGeometry, handleMaterial, 4); // 门把手

        let dummy0 = new THREE.Object3D();
        dummy0.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        dummy0.position.set(-12.52, 2.741, 3.290);
        dummy0.scale.set(-0.001, -0.001, -0.001);
        set(dummy0, [frameMesh, glassMesh, mesh2], 0);

        let dummy1 = new THREE.Object3D();
        dummy1.rotation.set(Math.PI / 2, Math.PI, 3 * Math.PI / 2);
        dummy1.position.set(-12.5244207382, 2.7411997318, 1.50942);
        dummy1.scale.set(-0.001, -0.001, -0.001);
        set(dummy1, [frameMesh, glassMesh, mesh2], 0);

        let pre1 = [
            1, 0, 0, 0,
            0, -1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
        let pre2 = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1, 0,
            0, 0, 0, 1
        ];
        let pre3 = [
            1, 0, 0, 0,
            0, -1, 0, 0,
            0, 0, -1, 0,
            0, 0, 0, 1
        ];

        set(dummy0, [frameMesh, glassMesh, mesh2], 1, pre1);
        set(dummy1, [frameMesh, glassMesh, mesh2], 2, pre2);
        set(dummy1, [frameMesh, glassMesh, mesh2], 3, pre3);

        frameMesh.castShadow = true; // 阴影
        frameMesh.receiveShadow = true;
        glassMesh.castShadow = true; // 阴影
        glassMesh.receiveShadow = true;
        mesh2.castShadow = true; // 阴影
        mesh2.receiveShadow = true;

        this.room.add(frameMesh);
        this.room.add(glassMesh);
        this.room.add(mesh2);

        openDoor();
        
        function openDoor(){ // 通过requestAnimationFrame()设置开门动画
            if (dummy0.rotation.z > 0) {
                dummy0.rotation.z -= 0.02;
                dummy1.rotation.z -= 0.02;
                set(dummy0, [frameMesh, glassMesh, mesh2], 0);
                set(dummy0, [frameMesh, glassMesh, mesh2], 1, pre1);
                set(dummy1, [frameMesh, glassMesh, mesh2], 2, pre2);
                set(dummy1, [frameMesh, glassMesh, mesh2], 3, pre3);
                requestAnimationFrame(openDoor);
            }
        }

        function set(dummy, meshs, i, pre) {
            if (typeof (pre) === "undefined") {
                if (typeof (meshs.length) === "undefined") {
                    dummy.updateMatrix();
                    meshs.setMatrixAt(i, dummy.matrix);
                    meshs.instanceMatrix.needsUpdate = true;
                } else {
                    for(let j = 0; j < meshs.length; j++)
                        set(dummy, meshs[j], i);
                }
            } else {
                if(typeof (meshs.length) === "undefined") {
                    let mat = new THREE.Matrix4();
                    mat.set(...pre);
                    dummy.updateMatrix();

                    meshs.setMatrixAt(i, dummy.matrix.multiply(mat));
                    meshs.instanceMatrix.needsUpdate=true;
                } else {
                    for(let j = 0; j < meshs.length; j++)
                        set(dummy, meshs[j], i, pre);
                }
            }

        }

    }

    async loadFirstResource() {

        const gltf = await this.loadGLB(`${this.url}first.glb`);
        this.roomScene = gltf.scene;
        this.room.add(this.roomScene);

        const json = await this.loadJSON(`${this.url}test.json`);
        const list = json.list;
        const mapsIndex = json.mapsIndex;

        const videoMaterial = new THREE.MeshBasicMaterial();
        let texture = new THREE.Texture();
        texture.image = document.getElementById("bg");
        texture.needsUpdate = true;
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        videoMaterial.map = texture;

        this.roomScene.traverse(node => { // 设置material
            if (node instanceof THREE.Mesh) {

                node.receiveShadow = true; // 阴影
                const textureIndex = parseInt(list[node.name]);

                if (node.name === "室内-小显示器屏幕（非）"||
                    node.name === "室内-大显示器屏幕（非）") {
                    node.material = videoMaterial;
                }
                else if (mapsIndex[textureIndex]) {
                    this.loadTexture(`${this.url}ConferenceRoom${textureIndex}.jpg`).then(texture => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        node.material = new THREE.MeshBasicMaterial({ map: texture });
                    })
                }

            }
        });

    }

    async loadOtherResource() {

        const resourceLoader = new ResourceLoader(
            this.url,
            this.camera,
            gltf => { }
        );
        this.room.add(resourceLoader.object);

    }

    setVideo(videoMaterial) {

        this.roomScene.traverse(node => { // 设置material
            if (node instanceof THREE.Mesh) {
                if (node.name === "室内-小显示器屏幕（非）"||
                    node.name === "室内-大显示器屏幕（非）") {
                    node.material = videoMaterial;
                }
            }
        });

    }

    loadGLB( path ) {

        return new Promise( (resolve, reject) => { 
            const modelLoader = new THREE.GLTFLoader();
            modelLoader.load( path, gltf => {
                resolve( gltf );
            } );
        } );

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

    loadTexture( path ) {

        return new Promise( (resolve, reject) => {
            new THREE.TextureLoader().load(
                path,
                texture => { // onLoad
                    resolve( texture );
                }, 
                null, // onProgress
                error => reject( error ) // onError
            )
        });
        
    }

}

export { RoomManager };
