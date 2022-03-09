class InstancedGroup {

    constructor(
        instanceCount,
        originMesh,
        animationUrl,
        textureUrl,
        textureCount,
        camera
    ) {

        // this.obj;
        this.instanceCount = instanceCount;
        this.originMesh = originMesh;
        this.animationUrl = animationUrl;
        this.textureUrl = textureUrl;
        this.textureCount = textureCount;
        this.camera = camera;

        this.ifAnimated = animationUrl;
        this.dummy = new THREE.Object3D();
        this.time;

        // matrix
        this.mcol0;
        this.mcol1;
        this.mcol2;
        this.mcol3;

        this.speed; // 动画速度
        this.animationType;
        this.textureType;

        // shader
        if (this.ifAnimated) this.vertURL = "shader/mdediumVerxtexShader.vert";
        else this.vertURL = "shader/lowVertexShader.vert"
        this.fragURL = "shader/highFragmentShader.frag";

    }

    async init() {

        // this.obj = new THREE.Object3D();
        this.originMesh.geometry = this.originMesh.geometry.toNonIndexed();

        this.mcol0 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol1 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol2 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol3 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.speed = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);
        this.animationType = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);
        this.textureType = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);

        for (let i = 0; i < this.instanceCount; i++) {
            this.reset(i);
        }

        const material = await this.initMaterial();
        const geometry = this.initGeometry();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;

        return mesh;

    }

    async initMaterial() {

        const textureData = await this.loadTexture(this.textureUrl);
        const vertexShader = await this.loadShader(this.vertURL);
        const fragmentShader = await this.loadShader(this.fragURL);

        let material = new THREE.RawShaderMaterial();
        material.vertexShader = vertexShader;
        material.fragmentShader = fragmentShader;

        let uniforms = this.ifAnimated ? await this.initAnimation() : { };
        uniforms.textureCount = { value: this.textureCount };
        uniforms.textureData = { value: textureData };
        material.uniforms = uniforms;

        return material;

    }

    async initAnimation() {

        const animations = await this.loadJSON(this.animationUrl);
        const boneCount = this.originMesh.skeleton.bones.length;
        const animationData = animations.animation.flat();
        const animationDataLength = animations.config.reduce((prev, cur) => prev + cur, 0); // sum
        const animationTextureLength = Math.floor(animationDataLength / 3);
        let uniforms = {
            time: { value: 0 },
            boneCount: { value: boneCount },
            animationFrameCount: { value: animations.config[0] / boneCount / 12 },
            animationTexture: { value: this.array2Texture(animationData) }, // 将动画数据保存为图片Texture格式
            animationTextureLength: { value: animationTextureLength }
        };
        
        let scope = this;
        updateAnimation();

        return uniforms;

        function updateAnimation() {
            let time = uniforms.time.value;
            uniforms.time = { value: (time + 1.0) % 60000 };
            uniforms.cameraPosition = { value: scope.camera.position };
            requestAnimationFrame(updateAnimation);
        }

    }

    initGeometry() {

        let geometry = new THREE.InstancedBufferGeometry();
        geometry.instanceCount = this.instanceCount;
        geometry.setAttribute('position', this.originMesh.geometry.attributes.position);
        geometry.setAttribute('inUV', this.originMesh.geometry.attributes.uv);
        geometry.setAttribute('normal', this.originMesh.geometry.attributes.normal);
        if (this.ifAnimated) {
            geometry.setAttribute('skinIndex', this.originMesh.geometry.attributes.skinIndex);
            geometry.setAttribute('skinWeight', this.originMesh.geometry.attributes.skinWeight);
            geometry.setAttribute('speed', this.speed);
            geometry.setAttribute('animationIndex', this.animationType);
        }

        geometry.setAttribute('mcol0', this.mcol0);
        geometry.setAttribute('mcol1', this.mcol1);
        geometry.setAttribute('mcol2', this.mcol2);
        geometry.setAttribute('mcol3', this.mcol3);

        geometry.setAttribute('textureIndex', this.textureType);

        return geometry;

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

    loadShader(path) {

        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onload =  () => resolve(xhr.responseText);
            xhr.onerror =  event => reject(event);
            xhr.open('GET', path);
            xhr.overrideMimeType("text/html;charset=utf-8");
            xhr.send();
        });

    }

    array2Texture(array) {

        let data = new Float32Array(array.length);
        data.set(array);
        const width = 1;
        const height = array.length / 3;
        const texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat, THREE.FloatType);
        return texture;

    }

    getMatrix(avatarIndex) {

        let matrix = new THREE.Matrix4();
        matrix.set(
            this.mcol0.array[3 * avatarIndex], this.mcol1.array[3 * avatarIndex], this.mcol2.array[3 * avatarIndex], this.mcol3.array[3 * avatarIndex],
            this.mcol0.array[3 * avatarIndex + 1], this.mcol1.array[3 * avatarIndex + 1], this.mcol2.array[3 * avatarIndex + 1], this.mcol3.array[3 * avatarIndex + 1],
            this.mcol0.array[3 * avatarIndex + 2], this.mcol1.array[3 * avatarIndex + 2], this.mcol2.array[3 * avatarIndex + 2], this.mcol3.array[3 * avatarIndex + 2],
            0, 0, 0, 1
        );
        return matrix;
    }

    getPosition(avatarIndex) {

        return [this.mcol3.array[3 * avatarIndex], this.mcol3.array[3 * avatarIndex + 1], this.mcol3.array[3 * avatarIndex + 2]];

    }

    getRotation(avatarIndex) {

        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);

        let euler = new THREE.Euler(0, 0, 0, 'XYZ');
        euler.setFromQuaternion(quaternion);
        return [euler.x, euler.y, euler.z];

    }

    getScale(avatarIndex) {

        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);
        return [scale.x, scale.y, scale.z];

    }

    reset(avatarIndex) {

        this.mcol0.setXYZ(avatarIndex, 0.1, 0, 0);
        this.mcol1.setXYZ(avatarIndex, 0, 0.1, 0);
        this.mcol2.setXYZ(avatarIndex, 0, 0, 0.1);
        this.mcol3.setXYZ(avatarIndex, 0, 0, 0);
        // this.textureType.setX(avatarIndex, 0);
        // if (this.ifAnimated) {
        //     this.speed.setX(avatarIndex, 1);
        //     this.animationType.setX(avatarIndex, 0);
        // }

    }

    setMatrix(avatarIndex, matrix) {

        this.mcol0.array[3 * avatarIndex] = matrix.elements[0];
        this.mcol0.array[3 * avatarIndex + 1] = matrix.elements[1];
        this.mcol0.array[3 * avatarIndex + 2] = matrix.elements[2];

        this.mcol1.array[3 * avatarIndex] = matrix.elements[4];
        this.mcol1.array[3 * avatarIndex + 1] = matrix.elements[5];
        this.mcol1.array[3 * avatarIndex + 2] = matrix.elements[6];

        this.mcol2.array[3 * avatarIndex] = matrix.elements[8];
        this.mcol2.array[3 * avatarIndex + 1] = matrix.elements[9];
        this.mcol2.array[3 * avatarIndex + 2] = matrix.elements[10];

        this.mcol3.array[3 * avatarIndex] = matrix.elements[12];
        this.mcol3.array[3 * avatarIndex + 1] = matrix.elements[13];
        this.mcol3.array[3 * avatarIndex + 2] = matrix.elements[14];

    }

    setPosition(avatarIndex, pos) {

        this.mcol3.array[3 * avatarIndex] = pos[0];
        this.mcol3.array[3 * avatarIndex + 1] = pos[1];
        this.mcol3.array[3 * avatarIndex + 2] = pos[2];

    }

    setRotation(avatarIndex, rot) {
        
        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);

        this.dummy.scale.set(scale.x, scale.y, scale.z);
        this.dummy.rotation.set(rot[0], rot[1], rot[2]);
        this.dummy.position.set(position.x, position.y, position.z);
        this.dummy.updateMatrix();

        this.setMatrix(avatarIndex, this.dummy.matrix);

    }

    setScale(avatarIndex, size) {

        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);
        let euler = new THREE.Euler(0, 0, 0, 'XYZ');
        euler.setFromQuaternion(quaternion);

        this.dummy.scale.set(size[0], size[1], size[2]);
        this.dummy.rotation.set(euler.x, euler.y, euler.z);
        this.dummy.position.set(position.x, position.y, position.z);
        this.dummy.updateMatrix();

        this.setMatrix(avatarIndex, this.dummy.matrix);
        
    }

    setTexture(avatarIndex, type) { //设置贴图类型

        this.textureType.array[avatarIndex] = type;

    }

    setAnimation(avatarIndex, type) { // 设置动画类型

        if (this.ifAnimated) {
            this.animationType.array[avatarIndex + 3] = type;
        }

    }

    setSpeed(avatarIndex, speed) { // 设置动画速度

        if (this.ifAnimated) {
            this.speed.array[avatarIndex] = speed;
        }

    }

    update() {

        this.mcol0.needsUpdate = true;
        this.mcol1.needsUpdate = true;
        this.mcol2.needsUpdate = true;
        this.mcol3.needsUpdate = true;
        this.textureType.needsUpdate = true;
        if (this.ifAnimated) {
            this.animationType.needsUpdate = true;
            this.speed.needsUpdate = true;
        }
        
    }

    move(avatarIndex, dPos) {

        let pos = this.getPosition(avatarIndex);
        this.setPosition(avatarIndex, [pos[0] + dPos[0], pos[1] + dPos[1], pos[2] + dPos[2]]);

    }
    rotation(avatarIndex, dRot) {

        let rot = this.getRotation(avatarIndex);
        this.setRotation(avatarIndex, [rot[0] + dRot[0], rot[1] + dRot[1], rot[2] + dRot[2]]);

    }

}

export { InstancedGroup }