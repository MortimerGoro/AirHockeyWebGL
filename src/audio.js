/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 MortimerGoro
*/

'use strict';

(function(){
    
window.Hockey = window.Hockey || {};
    
Hockey.AudioManager = function() {
    this.hitSounds = [];
    this.edgeSounds = [];
    this.goalSounds = [];
}

Hockey.AudioManager.prototype = {
    init: function(model) {
        this.model = model;
        function loadSounds(target, sounds) {
            var prefix = "audio/";
            var format = ".ogg";
            for (var i = 0; i < sounds.length; ++i) {
                var audio = new Audio();
                audio.src = prefix + sounds[i] + format;
                audio.load();
                target.push(audio);
            }
        }
        
        loadSounds(this.hitSounds, ["hit1", "hit2"]);
        loadSounds(this.edgeSounds, ["edge1", "edge2"]);
        loadSounds(this.goalSounds, ["goal1"]);     
    },
    
    playRandomSound: function(target, volume) {
        if (!this.model.soundEnabled || !target.length) {
            return;
        }
        
        var rnd = Math.floor(Math.random() * target.length);
        target[rnd].volume = volume || 0.5;
        target[rnd].play();
    },
    
    playHitSound: function(volume) {
        this.playRandomSound(this.hitSounds, volume);
    },
    
    playGoalSound: function(volume) {
        this.playRandomSound(this.goalSounds, volume);
    },
    
    playEdgeSound: function(volume) {
        this.playRandomSound(this.edgeSounds, volume);
    }
}
    
Hockey.Audio = new Hockey.AudioManager();
    
})();