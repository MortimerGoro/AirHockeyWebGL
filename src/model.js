/* 
 * GockeyWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/

'use strict';

(function(){
    
window.Hockey = window.Hockey || {};

Hockey.GameModel = function(renderer) {
    this.tableSize = {width:0,depth:0,height:0};
    this.goalSize = {width:0.3, depth:0.045};
    this.state = 0;
    this.difficulty = 0.5;
    this.numPucks = 4; //simultaneous pucks
    this.camera = 0;
    this.soundEnabled = true;
    this.playerA = {
        score: 0,
        paddle: null,
        radius: 0
    };
    this.playerB = {
        score: 0,
        paddle: null,
        radius: 0,
    };
    this.targetScore = 10;
    this.pucks = [];
    this.listeners = {};
}

Hockey.GameModel.STATES = {
    LOADING: 0,
    PLAYING: 1,
    RESTING: 2
}

Hockey.GameModel.CAMERAS = {
    FRONT: 0,
    TOP: 1,
    SIDE: 2
}

Hockey.GameModel.prototype = {
    
    on: function(eventName, callback) {
        var callbacks = this.listeners[eventName];
        if (!callbacks) {
            callbacks = [];
            this.listeners[eventName] = callbacks;
        }
        
        callbacks.push(callback);
    },
    
    notify: function(eventName, args){
        
        var callbacks = this.listeners[eventName];
        if (!callbacks) {
            return;
        }
        for (var i = 0; i < callbacks.length; ++i) {
            callbacks[i].apply(null, args || []);   
        }
    },
    addPuck: function(mesh, radius){
        this.pucks.push({
            mesh:mesh,
            radius:radius,
            active:true
        });
    },
    
    getPuckByMesh: function(mesh) {
        for (var i = 0; i < this.pucks.length; ++i) {
            if (this.pucks[i].mesh === mesh) {
                return this.pucks[i];   
            }
        }
        return null;
    },
    
    countActivePucks: function() {
        var result = 0;
        for (var i = 0; i < this.pucks.length; ++i) {
            if (this.pucks[i].active) {
                result++;   
            }
        }
        return result;
    },
    
    setState: function(state) {
        this.state = state;   
    },
    
    goal: function(playerIndex, mesh) {
        if (playerIndex) {
            this.playerB.score++;
        }
        else {
            this.playerA.score++;   
        }
        
        this.notify("goal", [this.getPuckByMesh(mesh)]);
    },
    
    createGUI: function() {
        var gui = new dat.GUI();
        var me = this;
        
        gui.add(this,"camera", Hockey.GameModel.CAMERAS).name("Camera").onFinishChange(function(){
           me.camera= Number.parseInt(me.camera); 
        });
        gui.add(this, "numPucks",1,10).step(1).name("Pucks").onFinishChange(function(){
            me.notify("pucksChanged");
        });
        gui.add(this, "difficulty",0,1).name("Difficulty");
        gui.add(this, "soundEnabled").name("Sounds");
        gui.remember();
        
    }
}
 
})();
