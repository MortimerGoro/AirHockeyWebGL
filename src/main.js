'use strict';

(function(){
    
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

        var canvas = document.createElement("canvas");
        canvas.screencanvas = true; //for cocoonjs
        var dpr = window.devicePixelRatio;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
        renderer.setClearColor(0x000000);
        renderer.setSize(canvas.width, canvas.height);
        document.getElementById("container").appendChild(canvas);
        canvas.style.cssText = "position:absolute;padding:0;margin:0;width:100%;height:100%";
        
        var model = new Hockey.GameModel();
        model.createGUI();
        gameScene = new Hockey.GameScene(renderer, model);
        
        requestAnimationFrame( render );
    }
    
    function render(){     
        gameScene.render();
        requestAnimationFrame(render);
    }
    
    window.onload = init;
    
})();