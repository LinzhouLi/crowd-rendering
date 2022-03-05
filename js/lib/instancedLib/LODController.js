class LODController {

    constructor( positions, camera ) {

        this.positions = positions;
        this.camera = camera;
        const gpu = new GPU();

        this.lodLevels = [300, 5000] // LOD分为三等, 此数组数字为距离平方

        // 计算人物位置与相机距离平方
        this.computeDistance = gpu.createKernel(function( positions, cameraPosition, lodLevels ) {

            const a = positions[this.thread.x][0] - cameraPosition[0];
            const b = positions[this.thread.x][1] - cameraPosition[1];
            const c = positions[this.thread.x][2] - cameraPosition[2];
            const distance = a * a + b * b + c * c; // 距离平方

            let lod = 2; // lod: 0, 1, 2
            if ( distance < lodLevels[0] ) lod = 0;
            else if ( distance < lodLevels[1] ) lod = 1;
            return lod;

        }).setOutput( [this.positions.length] );

    }

    update() {

        return this.computeDistance( this.positions, this.camera.position.toArray(), this.lodLevels );

    }

}

export { LODController };