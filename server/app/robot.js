var utils = require('./utils.js');
var box2d = require('./box2d-extended.js').box2d;

var SIZE = 1.0; // m
var DENSITY = 5.0; // kg/m^2
var FRICTION = 0.2;
var RESTITUTION = 0.1;
var SPEED = 2.0; // m/s
var SPEED_REVERSE = 1.0; // m/s
var ANGULAR_SPEED = Math.PI/2; // radians/s
var LATERAL_FRICTION = 10.0;

exports.Robot = function(world, position) {
	var body;

	init(position);

	this.destroy = function() {
		world.DestroyBody(body);
	};

	this.getPosition = function() {
		return body.GetPosition();
	};

	this.getRotation = function() {
		return body.GetAngle();
	};

	this.executeCommand = function(command) {
		switch (command) {
		case 'forward':
			applyImpulse(SPEED);
			break;

		case 'reverse':
			applyImpulse(-SPEED_REVERSE);
			break;

		case 'turnleft':
			applyAngularImpulse(-ANGULAR_SPEED);
			break;

		case 'turnright':
			applyAngularImpulse(ANGULAR_SPEED);
			break;

		case 'turnleftslow':
			applyAngularImpulse(-ANGULAR_SPEED/2);
			break;

		case 'turnrightslow':
			applyAngularImpulse(ANGULAR_SPEED/2);
			break;
		}
	};

	this.slowDown = function() {
		applyImpulse(-getRelativeVelocity().get_y());
		applyAngularImpulse(-utils.limitValue(body.GetAngularVelocity(), -ANGULAR_SPEED, ANGULAR_SPEED));
	};

	this.simulate = function() {
		applyFriction();
	};

	function init(position) {
		var bodyDef = new box2d.b2BodyDef();
		bodyDef.set_type(box2d.b2_dynamicBody);
		bodyDef.set_position(position);
		bodyDef.set_angle(Math.random() * 2.0 * Math.PI);
		body = world.CreateBody(bodyDef);

		var shape = new box2d.b2PolygonShape();
		shape.SetAsBox(SIZE / 2, SIZE / 2);

		var fixtureDef = new box2d.b2FixtureDef();
		fixtureDef.set_shape(shape);
		fixtureDef.set_density(DENSITY);
		fixtureDef.set_friction(FRICTION);
		fixtureDef.set_restitution(RESTITUTION);
		body.CreateFixture(fixtureDef);
	}

	function getRelativeVelocity() {
		return body.GetLinearVelocity().copy().rotate(-body.GetAngle());
	}

	function applyImpulse(speed) {
		var impulse = new box2d.b2Vec2(0.0, speed * body.GetMass()).rotate(body.GetAngle());
		body.ApplyLinearImpulse(impulse, body.GetPosition());
	}

	function applyAngularImpulse(angularSpeed) {
		body.ApplyAngularImpulse(angularSpeed * body.GetInertia());
	}

	function applyFriction() {
		var frictionalForce = getRelativeVelocity().copy()
				.mul(new box2d.b2Vec2(-LATERAL_FRICTION, 0))
				.rotate(body.GetAngle());

		body.ApplyForceToCenter(frictionalForce);
	}
};
