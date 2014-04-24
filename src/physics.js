/* 
 * AirHockeyWebGL is licensed under MIT licensed. See LICENSE.md file for more information.
 * Copyright (c) 2014 MortimerGoro
*/

'use strict';

(function(){
    
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var FixtureTypes = {
    EDGE: 0,
    PUCK: 1,
    PADDLE: 2,
    GOAL: 3
}
    
window.Hockey = window.Hockey || {};
    
    
Hockey.Physics = function(model) {
    this.model = model;
    this.pucks = [];
    this.paddles = [];
    
    Box2D.Common.b2Settings.b2_velocityThreshold = 0.1;
    var world = new Box2D.Dynamics.b2World(new b2Vec2(0,0),false);
    this.world = world;
    world.SetContinuousPhysics(true);
    world.SetContactListener(this);

    var groundDef = new Box2D.Dynamics.b2BodyDef();
    groundDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
    groundDef.position.Set(0,0);
    
    var ground = world.CreateBody( groundDef );
    this.ground = ground;
    
    function addEdge(v1x,v1y,v2x,v2y){
        var fixtureDef = new Box2D.Dynamics.b2FixtureDef;
        fixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        fixtureDef.shape.SetAsEdge(new b2Vec2(v1x,v1y), new b2Vec2(v2x,v2y));
        fixtureDef.friction = 0.1;
        fixtureDef.restitution = 0.8;
        fixtureDef.density = 0.8;
        fixtureDef.userData = {type: FixtureTypes.EDGE};

        ground.CreateFixture(fixtureDef) ;

    }
    
    function addCornerEdge(x, y, angle, radius){
        
        var steps = 5;
        for (var i = 1; i <= steps; ++i) {
            var a1 = angle - Math.PI * 0.5 * (i-1)/steps;
            var a2 = angle - Math.PI * 0.5 * (i)/steps;
            addEdge(x + radius * Math.cos(a1), y + radius * Math.sin(a1), x + radius * Math.cos(a2), y + radius * Math.sin(a2));             
        }
    }
    
    function addGoalPost(x,y,w,h){
        
        var bodyDef = new Box2D.Dynamics.b2BodyDef();
        bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
        bodyDef.position.Set(x + w * 0.5, y + h * 0.5);
        
        var fixtureDef = new Box2D.Dynamics.b2FixtureDef;
        fixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        fixtureDef.shape.SetAsBox(w/2,h/2);
        fixtureDef.friction = 0.1;
        fixtureDef.restitution = 0.8;
        fixtureDef.density = 0.8;
        fixtureDef.userData = {type: FixtureTypes.EDGE};
        
        var body = world.CreateBody(bodyDef);
        body.CreateFixture(fixtureDef) 
    }
    
    function addGoalSensor(x,y,w,h, playerIndex){
        var bodyDef = new Box2D.Dynamics.b2BodyDef();
        bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
        bodyDef.position.Set(x + w * 0.5, y + h * 0.5);
        
        var fixtureDef = new Box2D.Dynamics.b2FixtureDef;
        fixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
        fixtureDef.shape.SetAsBox(w/2,h/2);
        fixtureDef.userData = {type: FixtureTypes.GOAL, index:playerIndex };
        
        var body = world.CreateBody(bodyDef);
        var fixture = body.CreateFixture(fixtureDef) 
        fixture.SetSensor(true);
    }
    
    var table = model.tableSize;
    //add table edges
    var w = table.width * 0.5;
    var d = table.depth * 0.5;
    var cr = table.width * 0.1; //corner radius
    addEdge(w - cr,-d,-w + cr,-d); //BR BL
    addCornerEdge(-w + cr, -d + cr, 3 * Math.PI/2, cr);
    addEdge(-w,-d + cr,-w, d - cr); //BL TL
    addCornerEdge(-w + cr, d - cr, Math.PI, cr);
    addEdge(-w + cr,d, w - cr,d);//TL TR
    addCornerEdge(w - cr, d - cr, Math.PI * 0.5, cr);
    addEdge(w, d - cr, w, -d + cr); //TR BR  
    addCornerEdge(w - cr, -d + cr, 0, cr);
    
    //add goals
    var gw = model.goalSize.width * table.width; //goal width
    var gh = model.goalSize.depth * table.depth; //goal height
    var postWidth = gw * 0.05;
    var postDepth = gh;
    addGoalPost(-gw * 0.5, -table.depth/2, postWidth, postDepth );
    addGoalPost(gw * 0.5 - postWidth, -table.depth/2, postWidth, postDepth );
    addGoalPost(-gw * 0.5, table.depth/2 - postDepth, postWidth, postDepth );
    addGoalPost(gw * 0.5 - postWidth, table.depth/2 - postDepth, postWidth, postDepth );
    
    //TODO: Improve goal sensor (avoid resting the radius)
    gw-= model.pucks[0].radius;
    gh-= model.pucks[0].radius;
    addGoalSensor(-gw * 0.5, -table.depth/2, gw, gh, 0);
    addGoalSensor(-gw * 0.5, table.depth/2 - gh, gw, gh, 1);
    

    //add pucks
    for (var i = 0; i< model.pucks.length; ++i) {
        this.addPuck(model.pucks[i].mesh, model.pucks[i].radius);   
    }
    
    //add paddles
    this.addPaddle(model.playerA.paddle, model.playerA.radius);
    this.addPaddle(model.playerB.paddle, model.playerB.radius);
    
}

Hockey.Physics.prototype = {
    
    addPuck: function(mesh, radius) {
        var bodyDef = new Box2D.Dynamics.b2BodyDef() ;
        bodyDef.position.Set(mesh.position.x, mesh.position.z);
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

        var body = this.world.CreateBody( bodyDef ) ;

        var fixtureDef   = new Box2D.Dynamics.b2FixtureDef() ;
        fixtureDef.shape = new Box2D.Collision.Shapes.b2CircleShape(radius);

        fixtureDef.friction    = 0.2;
        fixtureDef.restitution = 0.8;
        fixtureDef.density     = 0.6;
        fixtureDef.userData = {type: FixtureTypes.PUCK, mesh: mesh};

        body.CreateFixture(fixtureDef) ;
        
        this.pucks.push({body:body, mesh:mesh});
    },
    
    addPaddle: function(mesh, radius) {
        var bodyDef = new Box2D.Dynamics.b2BodyDef() ;
        bodyDef.position.Set(mesh.position.x, mesh.position.z);
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

        var body = this.world.CreateBody( bodyDef ) ;

        var fixtureDef   = new Box2D.Dynamics.b2FixtureDef() ;
        fixtureDef.shape = new Box2D.Collision.Shapes.b2CircleShape(radius);
        fixtureDef.friction    = 0.5;
        fixtureDef.restitution = 0.5;
        fixtureDef.density     = 0.9; 
        fixtureDef.userData = {type: FixtureTypes.PADDLE};
        body.CreateFixture(fixtureDef) ;
        
        var def = new Box2D.Dynamics.Joints.b2MouseJointDef();

        def.bodyA = this.ground;
        def.bodyB = body;
        def.target = body.GetPosition();

        def.collideConnected = true;
        def.maxForce = 10000 * body.GetMass();
        def.dampingRatio = 0;

        var mouseJoint = this.world.CreateJoint(def);

        body.SetAwake(true);
        
        this.paddles.push({joint:mouseJoint, mesh:mesh, body:body});    
    },
    
    updatePaddles: function() {
        for (var i = 0; i < this.paddles.length; ++i) {
            var joint = this.paddles[i].joint;
            var mesh = this.paddles[i].mesh;
            joint.SetTarget(new b2Vec2(mesh.position.x, mesh.position.z));
        }
    },
    updatePucks: function() {
        for (var i = 0; i < this.pucks.length; ++i) {
            var puck = this.pucks[i].mesh;
            var body = this.pucks[i].body;
            body.SetPositionAndAngle(new b2Vec2(puck.position.x, puck.position.z), 0);
            body.SetLinearVelocity(new b2Vec2(0,0));
            body.SetActive(puck.visible);
        }
    },
    getPuckVelocity: function(mesh) {
        for (var i = 0; i < this.pucks.length; ++i) {
            if (this.pucks[i].mesh === mesh) {
               return this.pucks[i].body.GetLinearVelocity(); 
            }
        }
        return new b2Vec2(0,0);
    },
    
    getPucksAwayFromEdges: function() {
        for (var i = 0; i< this.pucks.length; ++i) {
            var body = this.pucks[i].body;
            if (body.IsActive()) {
                var posX = body.GetPosition().y;
                var posY = body.GetPosition().y;
                var force = 0.01;
                var fx = 0; 
                var fy = 0;
                //behind goal
                if (posY > this.model.tableSize.depth * (0.5 - this.model.goalSize.depth)) {   
                    fy = -force;
                }
                else if (posY < -this.model.tableSize.depth * (0.5 - this.model.goalSize.depth)) {
                    fy = force;  
                }
                
                //left and right edges
                if (posX < -this.model.tableSize.depth/2 * 0.9) {
                    fx = force;
                }
                if (posX > this.model.tableSize.depth/2 * 0.9) {
                    fx = -force;
                }
                
                if (fx || fy) {
                    body.ApplyForce(new b2Vec2(fx, fy),body.GetWorldCenter());
                }                    
                
            }
        }
        
    },
    simulate: function(dt) {
        this.getPucksAwayFromEdges();
        this.world.Step(dt || 1/60, 5, 5);
        this.world.ClearForces();
        
        for (var i = 0; i< this.pucks.length; ++i) {
            var obj = this.pucks[i];
            var pos = obj.body.GetWorldCenter();
            obj.mesh.position.x = pos.x;
            obj.mesh.position.z = pos.y;
            obj.mesh.rotation.y = obj.body.GetAngle();
        }        
    },
    
    BeginContact: function(contact) {
        var c1 = contact.m_fixtureA.GetUserData();
        var c2 = contact.m_fixtureB.GetUserData();
        
        if (c1.type === FixtureTypes.GOAL && c2.type === FixtureTypes.PUCK) {
            setTimeout(function(){
                contact.m_fixtureB.GetBody().SetActive(false);
            },10);
            this.model.goal(c1.index, c2.mesh);    
            return;
        }
        else if (c2.type === FixtureTypes.GOAL && c1.type === FixtureTypes.PUCK) {
            setTimeout(function(){
                contact.m_fixtureA.GetBody().SetActive(false);
            },10);
            this.model.goal(c2.index, c1.mesh);    
            return;  
        }
        else if (c2.type === FixtureTypes.PADDLE && c1.type === FixtureTypes.PUCK) {
            Hockey.Audio.playHitSound();
        }
        else if (c2.type === FixtureTypes.PUCK && c1.type === FixtureTypes.PADDLE) {
            Hockey.Audio.playHitSound();
        }
        else if (c2.type === FixtureTypes.EDGE && c1.type === FixtureTypes.PUCK) {
            Hockey.Audio.playEdgeSound();
        }
        else if (c2.type === FixtureTypes.PUCK && c1.type === FixtureTypes.EDGE) {
            Hockey.Audio.playEdgeSound();
        }
        
        
    },
    
    EndContact: function(contact) {
        
    },
    
    PreSolve: function(){
    },
    
    PostSolve: function(){
        
    }
 
}
    
})();