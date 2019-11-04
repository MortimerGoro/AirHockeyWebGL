import * as THREE from "../node_modules/three/build/three.module.js" 
import {GameModel} from '/src/model.js'
import {GameScene} from '/src/hockey.js'

var renderer;
var gameScene;

var requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout( callback, 1000 / 60 );
    };


function init(){
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(0x000000, 1);
    document.getElementById("container").appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;padding:0;margin:0;width:100%;height:100%";
    
    var model = new GameModel();
    model.createGUI();
    gameScene = new GameScene(renderer, model);

    render();
}

function render(){
    requestAnimationFrame(render);
    gameScene.render();
}

window.onload = init;