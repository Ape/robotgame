var utils = require('./utils.js');
var box2d = require('./box2d-extended.js').box2d;
var GameObject = require('./gameobject.js').GameObject;

var SIZE = 1.0; // m
var DENSITY = 5.0; // kg/m^2
var FRICTION = 0.2;
var RESTITUTION = 0.1;
var SPEED = 2.0; // m/s
var SPEED_REVERSE = 1.0; // m/s
var ANGULAR_SPEED = Math.PI/2; // radians/s
var LATERAL_FRICTION = 10.0;
var CANNON_LINEAR_RECOIL = 0.2; // m/s
var CANNON_ANGULAR_RECOIL = 0.2; // radians/s

exports.Robot = function(id, world, initialPosition) {
	GameObject.call(this, id, world, createBody(world, initialPosition));

	var self = this;
	var commands;

	self.getType = function() {
		return 'robot';
	};

	self.setCommands = function(newCommands) {
		commands = newCommands;
	};

	self.onCommandStep = function(stepNumber) {
		executeCommand(commands[stepNumber]);
	};

	self.onSlowdownStep = function() {
		applyImpulse(-getRelativeVelocity().get_y());
		applyAngularImpulse(-utils.limitValue(self._body.GetAngularVelocity(), -ANGULAR_SPEED, ANGULAR_SPEED));
	};

	self.simulate = function() {
		applyFriction();
	};

	function createBody(world, position) {
		var bodyDef = new box2d.b2BodyDef();
		bodyDef.set_type(box2d.b2_dynamicBody);
		bodyDef.set_position(position);
		bodyDef.set_angle(Math.random() * 2.0 * Math.PI);
		var body = world.getWorld().CreateBody(bodyDef);

		var shape = new box2d.b2PolygonShape();
		shape.SetAsBox(SIZE / 2, SIZE / 2);

		var fixtureDef = new box2d.b2FixtureDef();
		fixtureDef.set_shape(shape);
		fixtureDef.set_density(DENSITY);
		fixtureDef.set_friction(FRICTION);
		fixtureDef.set_restitution(RESTITUTION);
		body.CreateFixture(fixtureDef);

		return body;
	}

	function executeCommand(command) {
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
		case 'shootcannon':
			self._world.createCannonBall(self);
			applyImpulse(-CANNON_LINEAR_RECOIL);
			applyAngularImpulse((2 * Math.random() - 1) * CANNON_ANGULAR_RECOIL);
			break;
		}
	}

	function getRelativeVelocity() {
		return self.getVelocity().copy().rotate(-self.getRotation());
	}

	function applyImpulse(speed) {
		var impulse = new box2d.b2Vec2(0.0, speed * self.getMass()).rotate(self.getRotation());
		self._body.ApplyLinearImpulse(impulse, self.getPosition());
	}

	function applyAngularImpulse(angularSpeed) {
		self._body.ApplyAngularImpulse(angularSpeed * self.getInertia());
	}

	function applyFriction() {
		var frictionalForce = getRelativeVelocity().copy()
				.mul(new box2d.b2Vec2(-LATERAL_FRICTION, 0))
				.rotate(self.getRotation());

		self._body.ApplyForceToCenter(frictionalForce);
	}
};
