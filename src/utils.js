/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2019 MortimerGoro
*/

import * as THREE from "../node_modules/three/build/three.module.js"
import { DDSLoader } from '../node_modules/three/examples/jsm/loaders/DDSLoader.js';
import { MTLLoader } from '../node_modules/three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

let onProgress = function(name, xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log(name + ": " + Math.round( percentComplete, 2 ) + '% downloaded' );
    }
}

let onError = function(name, msg) {
    console.error(name + " failed to load: " + msg);
}
    
class Utils {
    constructor() {
        this.manager = new THREE.LoadingManager();
        this.manager.addHandler(/\.dds$/i, new DDSLoader());
    }

    loadOBJMTL(obj, mtl, callback) {
        new MTLLoader(this.manager)
        .setPath('models/')
        .load(obj, materials => {
            materials.preload();
            let loader = new OBJLoader2(this.manager);
            loader.addMaterials(materials);
            loader.load('models/' + obj, callback, onProgress.bind(null, obj), onError.bind(null, obj) );
        } );
    }

    loadGTLF(name, callback) {
        var loader = new GLTFLoader()
        .setPath('models/');
        loader.load(name, function (gltf) {
            callback(gltf.scene);
        });
    }

    loadTexture(path) {
        return new THREE.TextureLoader().load(path);
    }
}

export default new Utils();
