var TOWER_SHOOTER = {
	"name" : "Shooter",
	"attackInterval" : 300,
	"range" : 100,
	"bullet" : {
		"slows" : false,
		"damage" : 10,
		"speed" : 5,
		"splash" : false,
		"splashRange" : 0
	}
};

function Projectile(pos, damage, speed, targetEnemy) {
    iio.Circle.apply(this, [pos, 2])
    this.enableKinematics();
    this.setFillStyle('black');
    this.damage = damage;
    this.speed = speed;
    this.targetEnemy = targetEnemy;
    
    var vector = targetEnemy.pos.clone().sub(pos);
    this.setVel(vector.normalize().mult(speed));
    
}
Projectile.prototype = new iio.Circle();
Projectile.prototype.constructor = Projectile;


TowerDefence = function(io){
	var STATE_NONE = 0;
	var STATE_PLACING_TOWER = 1;

	var state = STATE_NONE;

	var towerIndicator = new iio.Circle(-100, -100, 16);
	towerIndicator.setFillStyle('rgba(255,255,255,0.5)');
	io.addObj(towerIndicator);

	io.addGroup('towers');
	io.addGroup('enemies');
	io.addGroup('bullets');

	var grid = new iio.Grid(0, 0, 20, 20, 32);
	grid.setStrokeStyle('rgba(0,0,0,0.1)', 1);
	io.addObj(grid);

	// COLLISION
	io.setCollisionCallback('bullets', 'enemies', function(bullet, enemy){
		// Only hit enemies we targeted
		if (bullet.targetEnemy == enemy) {
			io.rmvObj(bullet);
			enemy.health -= bullet.damage;
			if (enemy.health <= 0) {
				// Enemy is dead
				io.rmvObj(enemy);
			}
		}
	});

	io.setFramerate(60, function(){
		var towers = io.getGroup('towers');
		var enemies = io.getGroup('enemies');
		var bullets = io.getGroup('bullets');

		// Bullets
		for (var i = 0; i < towers.length; i++) {
			for (var e = 0; e < enemies.length; e++) {
				if (towers[i].pos.distance(enemies[e].pos) <= towers[i].range) {
					// Enemy within range
					var date = new Date();
					if (date.getTime() - towers[i].lastShot > towers[i].attackInterval) {
						var bullet = new Projectile(towers[i].pos, towers[i].bullet.damage, towers[i].bullet.speed, enemies[e]);
						
						towers[i].lastShot = date.getTime();
						io.addToGroup('bullets', bullet, 3);
					}
				}
			}
		}

		for (var i = 0; i < bullets.length; i++) {
			if (bullets[i].targetEnemy.health <= 0) {
				io.rmvObj(bullets[i]);
			} else {
				var vector = bullets[i].targetEnemy.pos.clone().sub(bullets[i].pos);
				bullets[i].setVel(vector.normalize().mult(bullets[i].speed));
			}
		};
	});

	// ENEMIES
	io.setFramerate(1, function(){
		var enemy = new iio.Circle(200, 0, 5);
		enemy.setFillStyle('blue');
		enemy.enableKinematics();
		enemy.setVel(0,0.5);
		enemy.setBound('bottom',io.canvas.height+80);
		enemy.health = 100;
		io.addToGroup('enemies', enemy, 2);
	});
	
	// MOUSE EVENTS
	io.canvas.addEventListener('mousedown', function(event){
		switch (state) {
			case STATE_PLACING_TOWER:
				var cell = grid.getCellAt(io.getEventPosition(event));
				var cellCenter = grid.getCellCenter(cell);
				var tower = new iio.Circle(cellCenter, 16);
				var towerType = TOWER_SHOOTER;
				tower.setFillStyle('green');

				tower.attackInterval = towerType.attackInterval;
				tower.bullet = {};
				tower.bullet.damage = towerType.bullet.damage;
				tower.bullet.speed = towerType.bullet.speed;
				tower.range = towerType.range;
				tower.lastShot = 0;
				io.addToGroup('towers', tower, 1);
				break;
		}
	});

	io.canvas.addEventListener('mousemove', function(event){
		// Tower indicator
		if (state == STATE_PLACING_TOWER) {
			var cell = grid.getCellAt(io.getEventPosition(event));
			towerIndicator.setPos(grid.getCellCenter(cell));
		}
	});

	window.addEventListener('keydown', function(event){
		// T is pressed
		if (iio.keyCodeIs('t', event)) {
			state = STATE_PLACING_TOWER;
		}
	});
};

iio.start(TowerDefence);