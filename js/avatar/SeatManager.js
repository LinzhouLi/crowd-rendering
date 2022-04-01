class SeatManager {

    constructor() {

        this.positions = [];
        this.chairs = new THREE.Object3D();
        this.url = "assets/model/chair.glb";
        this.lightmapUpperURL = "assets/lightmap/Lightmap_Chair_Upper.jpg";
        this.lightmapLowerURL = "assets/lightmap/Lightmap_Chair_Lower.jpg";
        let k, i, j;
        // 一楼前部
        for(k = 0; k < 3; k++) // 三部分
            for(i = 0; i < 12 * 2; i++)
                for(j = 0; j < 13 * 2; j++) // 每排26个人
                    this.positions.push([
                        103 - 5 * i / 2,
                        0.01 + i * 0.25 / 2,
                        85 - 4.1 * j / 2 - k * 75
                    ]);
        // 一楼后部
        for(k = 0; k < 3; k++)
            for(i = 0; i < 17 * 2; i++)
                for(j = 0; j < 13 * 2; j++)
                    this.positions.push([
                        31 - 9.1 * i / 2,
                        4.1 + i * 1.5 / 2,
                        85 - 4.1 * j / 2 - k * 75
                    ]);
        // 二楼
        for(k = 0; k < 3; k++)
            for(i = 0; i < 14 * 2; i++)
                for(j = 0; j < 13 * 2; j++)
                    this.positions.push([
                        -15 - 9 * i / 2,
                        88.55 + i * 5.0 / 2,
                        85 - 4.1 * j / 2 - k * 75
                    ]);

    }

    async create() {

        const gltf = await this.loadGLB(this.url);
        
        let lightmapUpper = await this.loadTexture(this.lightmapUpperURL);
        let lightmapLower = await this.loadTexture(this.lightmapLowerURL);

        let obj = gltf.scene.children[0];

        let geometry1 = obj.children[0].geometry;
        let material1 = obj.children[0].material;
        let mesh1 = new THREE.InstancedMesh(geometry1, material1, this.positions.length);

        let geometry2 = obj.children[1].geometry;
        let material2 = obj.children[1].material;
        let mesh2 = new THREE.InstancedMesh(geometry2, material2, this.positions.length);

        let dummy = new THREE.Object3D();
        let k = 0.5;
        for(let i = 0; i < this.positions.length; i++) {
            dummy.position.set(
                this.positions[i][0] + 0.5,
                this.positions[i][1] + 1.0,
                this.positions[i][2]
            );
            dummy.rotation.set(0, -Math.PI / 2, 0);
            dummy.scale.set(1.3 * k, 0.33 * k, 1.3 * k);
            dummy.updateMatrix(); // 由位置计算齐次坐标变换矩阵
            mesh1.setMatrixAt(i, dummy.matrix);
            mesh2.setMatrixAt(i, dummy.matrix);
        }
        
        mesh1.castShadow = true; // 阴影
        mesh1.receiveShadow = true;
        mesh2.castShadow = true; // 阴影
        mesh2.receiveShadow = true;

        material1.aoMap = lightmapLower;
        material1.aoMapIntensity = 0.8;
        material2.aoMap = lightmapUpper;
        material2.aoMapIntensity = 0.8;


        this.chairs.add(mesh1);
        this.chairs.add(mesh2);

        return this.chairs;

    }

    loadGLB( path ) {

        return new Promise( (resolve, reject) => { 
            const modelLoader = new THREE.GLTFLoader();
            modelLoader.load( path, gltf => {
                resolve( gltf );
            } );
        } );

    }

    loadTexture(path) {

        return new Promise((resolve, reject)=> {
            new THREE.TextureLoader().load(
                path,
                texture => { // onLoad
                    texture.flipY = false;
                    resolve(texture);
                }, 
                null, // onProgress
                error => reject(error) // onError
            )
        });
        
    }

}
export { SeatManager };
