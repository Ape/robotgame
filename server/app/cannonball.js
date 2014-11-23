var box2d = require('./box2d-extended.js').box2d;
var GameObject = require('./gameobject.js').GameObject;

var LIFETIME = 3; // steps
var SHOOT_OFFSET = 0.7; // m
var RADIUS = 0.2; // m
var SPEED = 15.0; // m/s
var DENSITY = 12.0; // kg/m^2
var FRICTION = 0.2;
var RESTITUTION = 0.1;

exports.CannonBall = function(id, world, shooter) {
	GameObject.call(this, id, world, createBody(world, shooter));

	var self = this;
	var lifetime = LIFETIME;

	self.getType = function() {
		return 'cannonball';
	};

	self.onSlowdownStep = function() {
		lifetime--;

		if (lifetime <= 0) {
			self._world.removeObject(self._id);
		}
	};

	function createBody(world, shooter) {
		var position = shooter.getPosition().copy()
				.add(new box2d.b2Vec2(0.0, SHOOT_OFFSET).rotate(shooter.getRotation()));
		var velocity = shooter.getVelocity().copy()
				.add(new box2d.b2Vec2(0.0, SPEED).rotate(shooter.getRotation()));

		var bodyDef = new box2d.b2BodyDef();
		bodyDef.set_type(box2d.b2_dynamicBody);
		bodyDef.set_position(position);
		bodyDef.set_linearVelocity(velocity);
		var body = world.getWorld().CreateBody(bodyDef);

		var shape = new box2d.b2CircleShape();
		shape.set_m_radius(RADIUS);

		var fixtureDef = new box2d.b2FixtureDef();
		fixtureDef.set_shape(shape);
		fixtureDef.set_density(DENSITY);
		fixtureDef.set_friction(FRICTION);
		fixtureDef.set_restitution(RESTITUTION);
		body.CreateFixture(fixtureDef);

		return body;
	}
};
