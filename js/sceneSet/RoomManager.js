import { ResourceLoader } from '../ResourceLoader.js';
import { Network } from'../Network.js';

class RoomManager{
    loader;
    room;
    myVideoManager;
    mid;
    url;
    camera;

    resourceManager;

    myResourceLoader;
    myNetwork;

    constructor(myVideoManager0, camera) {
        var scope = this;
        scope.loader = new THREE.GLTFLoader();
        scope.room = new THREE.Object3D();
        scope.myNetwork = new Network();
        scope.myVideoManager = myVideoManager0;
        scope.mid = 20;
        scope.url = "assets/model/room/";
        scope.camera = camera;

        scope.firstLoad(scope.url);
        scope.init();
    }
    firstLoad(url) { // scope.url+"first.glb"
        var scope = this;
        scope.myNetwork.getGlb(`${url}first.glb`, glb => {
            // 每个材质一个mesh
            scope.room.add(glb.scene);
            new THREE.XHRLoader(THREE.DefaultLoadingManager).load(`${url}test.json`, function (data) {
                var json = JSON.parse(data);
                var list = json.list;
                var mapsIndex = json.mapsIndex;

                glb.scene.traverse(node => {
                    if(node instanceof THREE.Mesh){
                        if (node.name === "室内-小显示器屏幕（非）"||
                            node.name === "室内-大显示器屏幕（非）") { //室内-大显示器屏幕（非）
                            //var screen=node;
                            //if(scope.myVideoManager.video)scope.myVideoManager.init();
                            //scope.myVideoManager.setMaterial(screen);
                            node.material = window.videoMaterial;
                        }
                        var index = parseInt(list[node.name]);
                        if (mapsIndex[index]) {
                            scope.myNetwork.getTexture(`${url}ConferenceRoom${index}.jpg`, texture => {
                                texture.wrapS = THREE.RepeatWrapping;
                                texture.wrapT = THREE.RepeatWrapping;
                                node.material = new THREE.MeshBasicMaterial({ map: texture });
                            });
                        }
                    }
                })

            });
        });
    }
}
RoomManager.prototype.init = function() {
    this.myResourceLoader = new ResourceLoader(
        this.url,
        this.camera,
        gltf => { }
    );
    this.room.add(this.myResourceLoader.object);
    this.room.scale.set(10, 10, 10); // 这里在预处理计算包围球时，可以通过设置scene来处理
    this.myLoad_door('assets/model/room/door.gltf');
}
RoomManager.prototype.myLoad_door = function(url) {
    var scope = this;
    scope.loader.load(url, gltf => {
        var geometry0 = gltf.scene.children[0].children[0].geometry;
        var geometry1 = gltf.scene.children[0].children[1].geometry;
        var geometry2 = gltf.scene.children[0].children[2].geometry;

        var material0 = gltf.scene.children[0].children[0].material;
        var material1 = gltf.scene.children[0].children[1].material;
        var material2 = gltf.scene.children[0].children[2].material;

        var mesh0 = new THREE.InstancedMesh(geometry0, material0, 4); // 门主体
        var mesh1 = new THREE.InstancedMesh(geometry1, material1, 4); // 门上的玻璃
        var mesh2 = new THREE.InstancedMesh(geometry2, material2, 4); // 门把手

        var dummy0 = new THREE.Object3D();
        dummy0.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        dummy0.position.set(-12.52, 2.741, 3.290);
        dummy0.scale.set(-0.001, -0.001, -0.001);
        set(dummy0, [mesh0, mesh1, mesh2], 0);

        var dummy1 = new THREE.Object3D();
        dummy1.rotation.set(Math.PI / 2, Math.PI, 3 * Math.PI / 2);
        dummy1.position.set(-12.5244207382, 2.7411997318, 1.50942);
        dummy1.scale.set(-0.001, -0.001, -0.001);
        set(dummy1, [mesh0, mesh1, mesh2], 0);

        var pre1 = [
            1,0,0,0,
            0,-1,0,0,
            0,0,1,0,
            0,0,0,1
        ];
        var pre2 = [
            1,0,0,0,
            0,1,0,0,
            0,0,-1,0,
            0,0,0,1
        ];
        var pre3 = [
            1,0,0,0,
            0,-1,0,0,
            0,0,-1,0,
            0,0,0,1
        ];
        set(dummy0, [mesh0, mesh1, mesh2], 1, pre1);
        set(dummy1, [mesh0, mesh1, mesh2], 2, pre2);
        set(dummy1, [mesh0, mesh1, mesh2], 3, pre3);


        move();
        function move(){ // 通过requestAnimationFrame()设置开门动画
            if (dummy0.rotation.z > 0) {
                dummy0.rotation.z -= 0.02;
                dummy1.rotation.z -= 0.02;
                set(dummy0, [mesh0, mesh1, mesh2], 0);
                set(dummy0, [mesh0, mesh1, mesh2], 1, pre1);
                set(dummy1, [mesh0, mesh1, mesh2], 2, pre2);
                set(dummy1, [mesh0, mesh1, mesh2], 3, pre3);
                requestAnimationFrame(move);
            }
        }

        // var myInterval = setInterval(function () { // setInterval()设置开门动画
        //     if (dummy0.rotation.z > 0) {
        //         dummy0.rotation.z -= 0.02;
        //         dummy1.rotation.z -= 0.02;
        //         set(dummy0, [mesh0,mesh1,mesh2], 0);
        //         set(dummy0, [mesh0,mesh1,mesh2], 1, pre1);
        //         set(dummy1, [mesh0,mesh1,mesh2], 2, pre2);
        //         set(dummy1, [mesh0,mesh1,mesh2], 3, pre3);
        //     } else clearInterval(myInterval);
        // }, 10);

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
                    var mat = new THREE.Matrix4();
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

        scope.room.add(mesh0);
        scope.room.add(mesh1);
        scope.room.add(mesh2);
    });
}
export { RoomManager };
