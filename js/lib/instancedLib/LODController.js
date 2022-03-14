class LODController {

    constructor( positions, camera ) {

        this.positions = positions;
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        // const gpu = new GPU();
        this.planeIndecies = [ 0, 1, 2, 3 ]; // 用哪些面进行视锥剔除 0:右 1:左 2:下 3:上 4:远 5:近
        this.lodLevels = [300, 5000] // LOD分为三等, 此数组数字为距离平方

        // 计算LOD与视锥剔除
        // this.computeDistanceGPU = gpu.createKernel(function( cameraPosition, frustumPlanes ) {

        //     for ( let i = 0; i < this.constants.planeCount; i++ ) {
        //         // 计算: dot(PlaneNormal, Point) + PlaneConstant
        //         let distanceToPlane = this.constants.positions[this.thread.x][0] * frustumPlanes[i * 4];
        //         distanceToPlane += this.constants.positions[this.thread.x][1] * frustumPlanes[i * 4 + 1];
        //         distanceToPlane += this.constants.positions[this.thread.x][2] * frustumPlanes[i * 4 + 2];
        //         distanceToPlane += frustumPlanes[i* 4 + 3];
        //         if ( distanceToPlane < 0 ) return -1;
        //     }

        //     // 计算LOD
        //     const a = this.constants.positions[this.thread.x][0] - cameraPosition[0];
        //     const b = this.constants.positions[this.thread.x][1] - cameraPosition[1];
        //     const c = this.constants.positions[this.thread.x][2] - cameraPosition[2];
        //     const distance = a * a + b * b + c * c; // 距离平方

        //     let lod = 2; // lod: 0, 1, 2
        //     if ( distance < this.constants.lodLevels[0] ) lod = 0;
        //     else if ( distance < this.constants.lodLevels[1] ) lod = 1;
        //     return lod;

        // }, {
        //     constants: { 
        //         positions: this.positions,
        //         lodLevels: this.lodLevels,
        //         planeCount: this.planeIndecies.length
        //     },
        //     output: [ this.positions.length ]
        // });

    }

    computeDistanceCPU( cameraPosition, frustumPlanes ) {

        let result = [];
        let camera = new THREE.Vector3( ...cameraPosition );

        for ( let i = 0; i < this.positions.length; i++ ) {

            let flag = true;
            let point = new THREE.Vector3( ...(this.positions[i]) );

            // 视锥剔除
            for ( let j = 0; j < this.planeIndecies.length; j++ ) {
                if ( this.frustum.planes[ this.planeIndecies[j] ].distanceToPoint( point ) < 0 ) {
                    result.push( -1 );
                    flag = false;
                    break;
                }
            }

            // LOD
            if ( flag ) {
                let distance = camera.distanceToSquared( point );
                let lod = 2;
                if ( distance < this.lodLevels[0] ) lod = 0;
                else if ( distance < this.lodLevels[1] ) lod = 1;
                result.push( lod )
            }

        }

        return result;

    }

    update() {

        // 求视锥体
        let matrix = new THREE.Matrix4().multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
        this.frustum.setFromProjectionMatrix( matrix );

        let frustumPlanes = [];
        this.frustum.planes[2].constant += 4;
        for ( let i = 0; i < this.planeIndecies.length; i++ ) {
            // 每个面由一个四维向量表示(法向量+与原点距离)
            frustumPlanes.push( 
                ...(this.frustum.planes[this.planeIndecies[i]].normal.toArray()), 
                this.frustum.planes[this.planeIndecies[i]].constant 
            );
        }

        return this.computeDistanceCPU( this.camera.position.toArray(), frustumPlanes );

    }

    computeFrustum() {

        let frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix( this.camera.projectionMatrix );
        return frustum;

    }

}

export { LODController };