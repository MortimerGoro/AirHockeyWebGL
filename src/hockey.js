/* 
 * GockeyWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/

'use strict';

(function(){
    
window.Hockey = window.Hockey || {};

var projector = new THREE.Projector();

Hockey.GameScene = function(renderer, gameModel) {
    this.renderer = renderer;
    this.init(gameModel);
}

Hockey.GameScene.prototype = {
    
    init: function(model) {
        this.model = model;
        this.input = {x:0, y:0};
        this.inputPlane = null;
        this.simulation = null;
        this.ai = null;
        
        //create scene
    	this.scene = new THREE.Scene();
        
		//initialize camera
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.5, 1000);
		this.scene.add(this.camera);
		this.camera.position.set(0,2.5,3);
		this.camera.lookAt(new THREE.Vector3(0,0,-1));
        
        //initialize audio
        Hockey.Audio.init(model);
        
        //initialize world
        this.loadBackground();
        this.loadLight();
        this.initInput();
        this.loadModels(modelsLoaded);
        
        var me = this;
        function modelsLoaded() {
            me.simulation = new Hockey.Physics(me.model);
            me.ai = new Hockey.AI(me.model, me.simulation);
            
            model.on("goal", function(puck){
                me.onGoal(puck);   
            });
            
            model.on("pucksChanged", function(){
               me.onPucksCountChanged(); 
            });
                      
            me.prepareToServe();
            me.model.setState(Hockey.GameModel.STATES.PLAYING);
        }
    
    },
    
    loadBackground: function() {
        
        var t = THREE.ImageUtils.loadTexture( "images/floor.jpg" );
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        
        var material = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: t },
                innerRadius: { type: "f", value: 0.3 },
                outerRadius: { type: "f", value: 0.9}
            },
            vertexShader: document.getElementById('vs_floor').textContent,
            fragmentShader: document.getElementById('fs_floor').textContent
        });
        
        var floorPlane = new THREE.PlaneGeometry(7,7);
        var floorMesh = new THREE.Mesh( floorPlane, material );
        floorMesh.rotation.x = -Math.PI * 0.5;
        this.scene.add(floorMesh);
        
        // Floor
        /*var floorPlane = new THREE.PlaneGeometry(7,7);
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff, map:THREE.ImageUtils.loadTexture( "images/floor.jpg"), ambient: 0xaaaaaa } );
        material.map.repeat.x = 4;
        material.map.repeat.y = 4;
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.RepeatWrapping;
    
        var floorMesh = new THREE.Mesh( floorPlane, material );
        floorMesh.rotation.x = -Math.PI * 0.5;
        this.scene.add(floorMesh);

        // Cover
        var coverPlane = new THREE.PlaneGeometry(7,7);
        var coverMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, map:THREE.ImageUtils.loadTexture( "images/cover.png"), transparent: true } );
        var coverMesh = new THREE.Mesh( coverPlane, coverMaterial );
        coverMesh.rotation.x = -Math.PI * 0.5;
        coverMesh.position.y = 0.1;
        
        this.scene.add(coverMesh);*/

    },
    
    loadSkybox: function() {
        var imagePrefix = "sky/";
        var directions  = ["posx", "negx", "posy", "negy", "posz", "negz"];
        var imageSuffix = ".jpg";
        var skyGeometry = new THREE.CubeGeometry( 500, 500, 500 );	

        var materialArray = [];
        for (var i = 0; i < 6; i++)
            materialArray.push( new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
                side: THREE.BackSide
            }));
        var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
        var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
        this.scene.add( skyBox );  
    },
    
    loadLight: function() {   
        this.scene.add(new THREE.AmbientLight(0x222222));
        
        var light = new THREE.SpotLight( 0xffffff, 0.8 );
        light.position.set( 0, 10, 0 );
        light.target.position.set( 0, 0, 0 );
        this.scene.add( light );
    },
    
    getCompoundBoundingBox: function (object3D) {
        var box = null;
        object3D.traverse(function (obj3D) {
            var geometry = obj3D.geometry;
            if (geometry === undefined) return;
            geometry.computeBoundingBox();
            if (box === null) {
                box = geometry.boundingBox;
            } else {
                box.union(geometry.boundingBox);
            }
        });
        return box;
    },

    loadModels: function(callback) {
        var me = this;
        var loader = new THREE.OBJMTLLoader();
        loader.load( 'models/table.obj', 'models/table.mtl', function ( object ) {
            var table = object;
            var bb = me.getCompoundBoundingBox(table);
            var tableSize = {width: bb.max.z - bb.min.z, 
                        depth: bb.max.x - bb.min.x, 
                        height: bb.max.y - bb.min.y};
            var scale = 1.75/tableSize.width;
            tableSize.width*=scale * 0.88;
            tableSize.depth*=scale * 0.93;
            tableSize.height*=scale * 0.95;
            
            me.model.tableSize = tableSize;
            
            table.scale.set(scale,scale,scale);
            table.position.set(0,tableSize.height,0);
            table.rotation.y = Math.PI/2;
            me.scene.add( table );
            
            //Custom surface
            var surfacePlane = new THREE.PlaneGeometry(tableSize.width,tableSize.depth);
            var surfaceMaterial = new THREE.MeshBasicMaterial( {color: 0xbbbbbb, map:THREE.ImageUtils.loadTexture( "images/surface.png") } );
            var surfaceMesh = new THREE.Mesh( surfacePlane, surfaceMaterial );
            surfaceMesh.rotation.x = -Math.PI * 0.5;

            surfaceMesh.position.y = tableSize.height+0.001;
            me.scene.add(surfaceMesh);
            
            me.inputPlane = new THREE.Plane(new THREE.Vector3(0,-1,0), tableSize.height);
            
            new THREE.OBJMTLLoader().load('models/paddle.obj', 'models/paddle.mtl', paddleLoaded);
            
        } );
        
        function paddleLoaded(object) {
            
            var paddle = object;
            var model = me.model;
            var bb = me.getCompoundBoundingBox(paddle);
            var paddleRadius = model.tableSize.width * 0.05;
            var scale = paddleRadius * 2 / (bb.max.x - bb.min.x);
            
            paddle.position.set(0,model.tableSize.height,model.tableSize.depth * 0.25);
            paddle.scale.set(scale, scale, scale);
            
            me.model.playerA.paddle = paddle;
            me.model.playerA.radius = paddleRadius;
            
            var paddle2 = paddle.clone();
            paddle2.position.z = -model.tableSize.depth * 0.25;
            
            me.model.playerB.paddle = paddle2;
            me.model.playerB.radius = paddleRadius;
            
            me.scene.add(paddle);
            me.scene.add(paddle2);
            
            new THREE.OBJMTLLoader().load('models/puck.obj', 'models/puck.mtl', puckLoaded);
        }
        
        function puckLoaded(object) {
            var puckRadius = me.model.playerA.radius * 0.7;
            var bb = me.getCompoundBoundingBox(object);
            var scale = puckRadius * 2 / (bb.max.x - bb.min.x);
            object.scale.set(scale, scale, scale);
            
            for (var i = 0; i< me.model.numPucks; ++i) {
                var puck = i == 0 ? object : object.clone();
                puck.position.set(0,me.model.tableSize.height,0);
                me.scene.add(puck);
                me.model.addPuck(puck, puckRadius);
            }
            
            callback(); 
        }
        
        
    },
    
    initInput: function() {
        
        var me = this;
        function inputHandler(ev) {
            if (ev.targetTouches && ev.targetTouches.length > 1) {
                //me.serve();
                return;
            }
            var x = ev.targetTouches ? ev.targetTouches[0].clientX : ev.clientX;
            var y = ev.targetTouches ? ev.targetTouches[0].clientY : ev.clientY;
            me.processInput(x,y);
        }
        
        this.renderer.domElement.addEventListener("mousedown", function(){});
        this.renderer.domElement.addEventListener("mousemove", inputHandler);
        this.renderer.domElement.addEventListener("touchstart", inputHandler);
        this.renderer.domElement.addEventListener("touchmove", inputHandler);
    },
    
    processInput: function(x,y) {
        this.input.x = x;
        this.input.y = y;
    },
    
    prepareToServe: function() {
        var model = this.model;
        for (var i = 0; i < model.numPucks; ++i) {
            var mesh = model.pucks[i].mesh;
            mesh.position.z = model.tableSize.depth * 0.1;
            mesh.position.x = -model.tableSize.width * 0.5 + model.tableSize.width * (i+1) / (model.numPucks + 1) ;
            mesh.traverse( function ( object ) { object.visible = true; } );
            model.pucks[i].active = true;
        }
        this.simulation.updatePucks();
        this.updateScores();
    },
    onGoal: function(puck) {
        Hockey.Audio.playGoalSound();
        puck.mesh.traverse( function ( object ) { object.visible = false; } );
        puck.active = false;
        this.updateScores();
        
        if (this.model.countActivePucks() === 0) {
            var me = this;
            setTimeout(function() {
                me.prepareToServe(); 
            }, 100);   
        }
    },
    onPucksCountChanged: function() {
        
        var current = this.model.pucks.length;
        var target = this.model.numPucks;
        
        if (current > target) {
            //disable some pucks
            for (var i = current - target; i < current; ++i) {
                this.model.pucks[i].active = false;   
                this.model.pucks[i].mesh.traverse( function ( object ) { object.visible = false; } );
            }
        }
        else if (this.model.pucks.length - this.model.numPucks) {
            //add new pucks
            for (var i = current; i < target; ++i) {
                var puck = this.model.pucks[0].mesh.clone();
                this.scene.add(puck);
                var radius = this.model.pucks[0].radius;
                this.model.addPuck(puck, radius);
                this.simulation.addPuck(puck,radius);               
            }
        }
        
        this.prepareToServe();
        
    },
    updateScores: function() {
        document.getElementById("playerA_score").innerHTML = "Player: " + this.model.playerA.score;
        document.getElementById("playerB_score").innerHTML = "IA: " + this.model.playerB.score;
    },
    update: function() {
        
        var model = this.model;
        var tableSize = model.tableSize;
        
        if (model.state === Hockey.GameModel.STATES.LOADING) {
            return;
        }
        
        //normalize input
        var px = (this.input.x / window.innerWidth ) * 2 - 1;
        var py = -(this.input.y / window.innerHeight ) * 2 + 1; 
        
        //set camera position
        var camera = this.camera;
        var tableSize = model.tableSize;
        if (model.camera === Hockey.GameModel.CAMERAS.FRONT) {
            var cx = tableSize.width * 0.5 * px;
            var cy = 2.5 + tableSize.height + 0.5 * py;
            var cz = tableSize.depth;
            camera.position.set(cx,cy,cz);
            camera.lookAt(new THREE.Vector3(0, tableSize.height, 0));
        }
        else if (model.camera === Hockey.GameModel.CAMERAS.TOP) {
            camera.position.set(0, tableSize.height * 4.5, 0.1);
            camera.lookAt(new THREE.Vector3(0, tableSize.height, 0));
        }
        else if (model.camera === Hockey.GameModel.CAMERAS.SIDE) {
            camera.position.set(-tableSize.width, 2.5 + tableSize.height + 0.5 * py, 0);
            camera.lookAt(new THREE.Vector3(0, tableSize.height, 0));
        }
        
        //Project input to table plane
        var vector = new THREE.Vector3(px, py, 0.5);
        projector.unprojectVector( vector, camera );
        var ray = new THREE.Ray( camera.position, vector.sub( camera.position ).normalize() );
        var intersect = ray.intersectPlane(this.inputPlane);
        
        if (!intersect) {
            intersect = paddle.position.clone();
        }
        
        //set paddle position  
        var paddle = model.playerA.paddle;
        var paddleRadius = model.playerA.radius;
        paddle.position.x = Math.max(-tableSize.width/2 + paddleRadius, intersect.x);
        paddle.position.x = Math.min(tableSize.width/2 - paddleRadius, paddle.position.x);
        paddle.position.z = Math.max(0, intersect.z);
        paddle.position.z = Math.min(tableSize.depth/2 - paddleRadius, paddle.position.z);
        paddle.position.y = tableSize.height; 
        
        if (paddle.position.z + paddleRadius > (tableSize.depth * (0.5 - model.goalSize.depth)) 
            && Math.abs(paddle.position.x)  < tableSize.width * model.goalSize.width * 0.5 + paddleRadius) {
            paddle.position.z = tableSize.depth * (0.5 - model.goalSize.depth) - paddleRadius;            
        }
        
        
        if (model.state === Hockey.GameModel.STATES.PLAYING) {
            this.ai.play();
            this.simulation.updatePaddles();
            this.simulation.simulate();
        }

    },
    
    render: function(){
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}
 
})();
