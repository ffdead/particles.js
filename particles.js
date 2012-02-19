Particle2D = function (x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.mass = 0;
    this.alpha = 0;
    this.burnRate = 0;
    this.sharpness = 0;
    this.color = {
      RED: 0,
      GREEN: 0,
      BLUE: 0
    };
};

Particle2D.prototype = {
  
  getColor: function () {
    return 'rgba(' + this.color.RED + ',' + this.color.GREEN + ',' + this.color.BLUE + ',' + this.alpha + ')';
  },
  
  draw: function (context) {
    var size = this.mass;
    var halfSize = size >> 1;
    var x = ~~this.x;
    var y = ~~this.y;
    var sizeSmall = halfSize * this.sharpness;
                    
    var radgrad = context.createRadialGradient( x + halfSize, y + halfSize, sizeSmall, x + halfSize, y + halfSize, halfSize);  
    radgrad.addColorStop( 0, this.getColor() );   
    radgrad.addColorStop( 1, 'rgba(50,0,30,0)' );
    context.fillStyle = radgrad;
    context.fillRect( x, y, size, size );
  }

};



ParticleSystem = function (canvas) {
  
  this.UNIVERSE_GRAVITY        = 0.0005;
  this.UNIVERSE_FRICTION       = 0.02; //0-1
  this.PARTICLE_MASS_MIN       = 30;
  this.PARTICLE_MASS_MAX       = 60;
  this.PARTICLE_BURN_RATE      = 0.97; 
  this.PARTICLE_SHARPNESS      = 0.2;
  this.PARTICLE_VELOCITY_X_MIN = -0.055;
  this.PARTICLE_VELOCITY_X_MAX = 0.055;
  this.PARTICLE_VELOCITY_Y_MIN = -0.18;
  this.PARTICLE_VELOCITY_Y_MAX = 0;

  // default particle color
  this.SPAWN_COLOR = {
    RED: 255,
    GREEN: 155,
    BLUE: 0
  };
  
  // default spawn position
  this.x = canvas.width >> 1;
  this.y = canvas.height * 0.8;
    
  this.particles = [];
  this.autoSpawn = false;

  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");

  // add glow
  this.ctx.globalCompositeOperation = 'lighter';

  this.autoClear = true;
  this.dirtyRegion = {xMin: 0, xMax: 0, yMin: 0, yMax:0};
  
  this.lastFrameTime = -1;
};



ParticleSystem.prototype.drawNextFrame = function() {
  
  // calculate time since last frame was drawn
  var time = +new Date();
  var timeSinceLastFrame = this.lastFrameTime > 0 ? time - this.lastFrameTime : 0;
  this.lastFrameTime = time;
  
  // calculate frame delay multiple
  var m = (timeSinceLastFrame === 0) ? 1 : (timeSinceLastFrame / (1000/60));
  
  if (this.autoClear) {
    // clear dirty region
    var margin = this.PARTICLE_MASS_MAX*2;
    this.ctx.clearRect(
      this.dirtyRegion.xMin - margin,
      this.dirtyRegion.yMin - margin, 
      this.dirtyRegion.xMax - this.dirtyRegion.xMin + (margin * 2), 
      this.dirtyRegion.yMax - this.dirtyRegion.yMin + (margin * 2)
    );
    // reset dirty region
    this.dirtyRegion.xMin = this.canvas.width;
    this.dirtyRegion.xMax = 0;
    this.dirtyRegion.yMin = this.canvas.height;
    this.dirtyRegion.yMax = 0;
  }
  
  // draw next frame
  for (var i = 0; i < this.particles.length; i++) {

      var p = this.particles[i];
      
      // apply velocities and forces
      p.x += p.velocityX * p.mass * m;
      p.y += p.velocityY * p.mass * m;
      p.velocityX *= Math.pow(1-this.UNIVERSE_FRICTION, m);
      p.velocityY *= Math.pow(1-this.UNIVERSE_FRICTION, m);
      p.velocityY += this.UNIVERSE_GRAVITY * m;
      p.alpha = p.alpha * Math.pow(p.burnRate, m);
     
      // particle knows what it should look like
      p.draw(this.ctx);
      
      // remove particles out of screen or alpha close to zero
      if (p.alpha <= 0.1 || p.y < 0 || p.x < 0 || p.y > this.canvas.height || p.x > this.canvas.width) {
        this.particles.splice(i, 1);
        i--;
      } else if (this.autoClear) {
        // update dirty region
        if (p.x > this.dirtyRegion.xMax) this.dirtyRegion.xMax = p.x;
        if (p.x < this.dirtyRegion.xMin) this.dirtyRegion.xMin = p.x;
        if (p.y > this.dirtyRegion.yMax) this.dirtyRegion.yMax = p.y;
        if (p.y < this.dirtyRegion.yMin) this.dirtyRegion.yMin = p.y;
      }

  }

};

/**
 * Spawn new particles
 * @param n {int} number of new particles to spawn
 */
ParticleSystem.prototype.spawn = function(n) {

  for (n; n > 0; n--) {
    
    var particle = new Particle2D(this.x, this.y);
    
    particle.velocityX   = Math.random() * (this.PARTICLE_VELOCITY_X_MAX-this.PARTICLE_VELOCITY_X_MIN) + this.PARTICLE_VELOCITY_X_MIN;
    particle.velocityY   = Math.random() * (this.PARTICLE_VELOCITY_Y_MAX-this.PARTICLE_VELOCITY_Y_MIN) + this.PARTICLE_VELOCITY_Y_MIN;
    particle.mass        = Math.random() * (this.PARTICLE_MASS_MAX-this.PARTICLE_MASS_MIN) + this.PARTICLE_MASS_MIN;
    particle.alpha       = Math.random();
    particle.burnRate    = this.PARTICLE_BURN_RATE;
    particle.sharpness   = this.PARTICLE_SHARPNESS;
    particle.color.RED   = this.SPAWN_COLOR.RED;
    particle.color.GREEN = this.SPAWN_COLOR.GREEN;
    particle.color.BLUE  = this.SPAWN_COLOR.BLUE;
    
    this.particles.push(particle);
  }

};

