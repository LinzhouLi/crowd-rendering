class LODController {

    constructor( positions, camera ) {

        this.positions = positions;
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        const gpu = new GPU();
        this.planeIndecies = [ 0, 1, 3 ]; // 用哪些面进行视锥剔除 0:右 1:左 2:下 3:上 4:远 5:近
        this.lodLevels = [200, 5000] // LOD分为三等, 此数组数字为距离平方

        // 计算LOD与视锥剔除
        this.computeDistance = gpu.createKernel(function( positions, cameraPosition, lodLevels, frustumPlanes ) {

            for ( let i = 0; i < this.constants.planeCount; i++ ) {
                // 计算: dot(PlaneNormal, Point) + PlaneConstant
                let distanceToPlane = positions[this.thread.x][0] * frustumPlanes[i * 4];
                distanceToPlane += positions[this.thread.x][1] * frustumPlanes[i * 4 + 1];
                distanceToPlane += positions[this.thread.x][2] * frustumPlanes[i * 4 + 2];
                distanceToPlane += frustumPlanes[i* 4 + 3];
                if ( distanceToPlane < 0 ) return -1;
            }

            // 计算LOD
            const a = positions[this.thread.x][0] - cameraPosition[0];
            const b = positions[this.thread.x][1] - cameraPosition[1];
            const c = positions[this.thread.x][2] - cameraPosition[2];
            const distance = a * a + b * b + c * c; // 距离平方

            let lod = 2; // lod: 0, 1, 2
            if ( distance < lodLevels[0] ) lod = 0;
            else if ( distance < lodLevels[1] ) lod = 1;
            return lod;

        }, {
            constants: { planeCount: this.planeIndecies.length },
            output: [ this.positions.length ]
        });

    }

    update() {

        // 求视锥体
        let matrix = new THREE.Matrix4().multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
        this.frustum.setFromProjectionMatrix( matrix );

        let frustumPlanes = [];
        for ( let i = 0; i < this.planeIndecies.length; i++ ) {
            // 每个面由一个四维向量表示(法向量+与原点距离)
            frustumPlanes.push( 
                ...(this.frustum.planes[this.planeIndecies[i]].normal.toArray()), 
                this.frustum.planes[this.planeIndecies[i]].constant 
            );
        }

        return this.computeDistance( this.positions, this.camera.position.toArray(), this.lodLevels, frustumPlanes );

    }

    computeFrustum() {

        let frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix( this.camera.projectionMatrix );
        return frustum;

    }

}

export { LODController };