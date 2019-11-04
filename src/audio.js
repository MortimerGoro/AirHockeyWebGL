/* 
 * PingPongWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 MortimerGoro
*/
    
class AudioManager {
    constructor() {
        this.hitSounds = [];
        this.edgeSounds = [];
        this.goalSounds = [];
    }

    init(model) {
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
    }

    playRandomSound(target, volume) {
        if (!this.model.soundEnabled || !target.length) {
            return;
        }
        
        var rnd = Math.floor(Math.random() * target.length);
        target[rnd].volume = volume || 0.5;
        //target[rnd].play();
    }
    
    playHitSound(volume) {
        this.playRandomSound(this.hitSounds, volume);
    }
    
    playGoalSound(volume) {
        this.playRandomSound(this.goalSounds, volume);
    }
    
    playEdgeSound(volume) {
        this.playRandomSound(this.edgeSounds, volume);
    }
}

export default new AudioManager();