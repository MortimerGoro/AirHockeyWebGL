import * as THREE from '../node_modules/three/build/three.module.js';

import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

var container, stats, controls;
var camera, scene, renderer;

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
    camera.position.set( - 1.8, 0.9, 2.7 );

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xdddddd));

    var loader = new GLTFLoader().setPath( 'models/' );
            loader.load( 'table.gltf', function ( gltf ) {

                gltf.scene.traverse( function ( child ) {

                    if ( child.isMesh ) {

                        //child.material.envMap = envMap;

                    }

                } );

                scene.add( gltf.scene );

            } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, - 0.2, - 0.2 );
    controls.update();

    //window.addEventListener( 'resize', onWindowResize, false );

    // stats
    stats = new Stats();
    container.appendChild( stats.dom );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );

    stats.update();

}