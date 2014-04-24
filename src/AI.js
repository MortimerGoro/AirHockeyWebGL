/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 Imanol Fernandez @MortimerGoro
*/

'use strict';

(function(){
    
window.Hockey = window.Hockey || {};
    
var targetPos = new THREE.Vector3(0,0,0);
var goalPos = new THREE.Vector3(0,0,0);
    
Hockey.AI = function(model, simulation) {
    this.model = model;
    this.simulation = simulation;
}

Hockey.AI.prototype = {
    
    play: function() {
        var model = this.model;
        var myPos = model.playerB.paddle.position;
        var tableSize = model.tableSize;
        var paddleRadius = model.playerB.radius;
        
        //select puck
        var targetPuck = null;
        var bestHeuristic = 0;
        
        for (var i = 0; i < model.pucks.length; ++i){
            var puck = model.pucks[i];
            var score = this.heuristic(puck);
            if (score > 0 && score > bestHeuristic) {
                targetPuck = puck;
                bestHeuristic = score;
            }
        }

        if (targetPuck){
            var puckPos = targetPuck.mesh.position;
            targetPos.set(puckPos.x, tableSize.height, puckPos.z - paddleRadius * 0.9 - targetPuck.radius * 0.9);  
        }
        else {
            //defensive position
            targetPos.set(0, tableSize.height, -tableSize.depth * 0.4);
        }
        
        targetPos.x = Math.max(-tableSize.width/2 + paddleRadius, targetPos.x);
        targetPos.x = Math.min(tableSize.width/2 - paddleRadius, targetPos.x);
        targetPos.z = Math.min(0, targetPos.z);
        targetPos.z = Math.max(-tableSize.depth/2 + paddleRadius, targetPos.z);
        
        if (targetPos.z + paddleRadius < (-tableSize.depth * (0.5 - model.goalSize.depth)) 
            && Math.abs(paddle.position.x)  < tableSize.width * model.goalSize.width * 0.5 + paddleRadius) {
            paddle.position.z = -tableSize.depth * (0.5 - model.goalSize.depth) + paddleRadius;            
        }
        
        var diffX = Math.abs(targetPos.x - myPos.x);
        var diffZ = Math.abs(targetPos.z - myPos.z);
        var speed = 0.1 + 0.9 * model.difficulty;
        var speedX = tableSize.width* 0.03 * speed;
        var speedZ = tableSize.depth* 0.03 * speed;
        myPos.x+= Math.min(diffX, speedX) * (myPos.x > targetPos.x ? -1 : 1);
        myPos.z+= Math.min(diffZ, speedZ) * (myPos.z > targetPos.z ? -1 : 1);
    },
    
    heuristic: function(puck) {
        if (!puck.active) {
            return 0;   
        }
        
        if (puck.mesh.position.z > 0) {
            //puck in the rival field
            return 0;   
        }
        
        var v = this.simulation.getPuckVelocity(puck.mesh);
        if (v.y > 0.2 ) {
            //puck already going to rival field
            return 0;            
        }
        
        var result = 1;
        
        var table = this.model.tableSize;
        
        goalPos.set(0, this.model.tableSize.height, -table.depth * 0.49);
        var distance = puck.mesh.position.distanceTo(goalPos);
        
        result+= Math.max(this.model.tableSize.depth *0.5 - distance ,0);
        
        if (Math.abs(puck.mesh.position.z) > table.depth * (0.5 - this.model.goalSize.depth)) {
            result*= 0.2; //avoid pucks behind the goal   
        }
        
        return result;
                
    }
}
    
})();