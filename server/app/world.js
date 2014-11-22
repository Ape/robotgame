var box2d = require('./box2d-extended.js').box2d;

var TIMESTEP = 1.0/60.0; // s
var COMMAND_FRAMES = 60;
var SLOWDOWN_FRAMES = 15;
var ARENA_WIDTH = 20.0; // m
var ARENA_HEIGHT = 15.0; // m
var GRAVITY = new box2d.b2Vec2(0.0, 0.0); // m/s^2
var ROBOT_SIZE = 1.0; // m
var ROBOT_SPEED = 2.0; // m/s
var ROBOT_SPEED_REVERSE = 1.0; // m/s
var ROBOT_ANGULAR_SPEED = Math.PI/2; // radians/s
var LATERAL_FRICTION = 10.0;
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;

function World() {
	var self = this;
	var robots;
	var world;

	init();

	this.createRobot = function() {
		var id = nextRobotId();
		var robot = createRobot();
		robots[id] = robot;

		return id;
	};

	this.removeRobot = function(id) {
		world.DestroyBody(robots[id].body);
		delete robots[id];
	};

	this.getTimestep = function() {
		return TIMESTEP;
	}

	this.getFrame = function() {
		var robotInfo = [];

		forEachRobot(function(robot, id) {
			position = robot.body.GetPosition();

			robotInfo.push({
				id: id,
				position: {
					x: position.get_x(),
					y: position.get_y(),
				},
				rotation: robot.body.GetAngle(),
			});
		});

		return {robots: robotInfo};
	};

	this.runTurn = function(commandList) {
		var frames = [];

		commandList.forEach(function(commands) {
			forEachRobot(function(robot, robotId) {
				executeCommand(robot, commands[robotId]);
			});

			simulate(frames, COMMAND_FRAMES);

			forEachRobot(function(robot) {
				slowDown(robot);
			});

			simulate(frames, SLOWDOWN_FRAMES);
		});

		return frames;
	};

	function init() {
		robots = {};
		world = new box2d.b2World(GRAVITY);
		createWalls();
	}

	function nextRobotId() {
		var id = 0;

		while (id in robots) {
			id++;
		}

		return id;
	}

	function numberOfRobots() {
		return Object.keys(robots).length;
	}

	function forEachRobot(action) {
		for (id in robots) {
			action(robots[id], parseInt(id));
		}
	}

	function createWalls() {
		createWall(new box2d.b2Vec2(0.0, 0.0), new box2d.b2Vec2(ARENA_WIDTH, 0.0));
		createWall(new box2d.b2Vec2(ARENA_WIDTH, 0.0), new box2d.b2Vec2(ARENA_WIDTH, ARENA_HEIGHT));
		createWall(new box2d.b2Vec2(ARENA_WIDTH, ARENA_HEIGHT), new box2d.b2Vec2(0.0, ARENA_HEIGHT));
		createWall(new box2d.b2Vec2(0.0, ARENA_HEIGHT), new box2d.b2Vec2(0.0, 0.0));
	}

	function createWall(startPoint, endPoint) {
		var shape = new box2d.b2EdgeShape();
		shape.Set(startPoint, endPoint);

		var bodyDef = new box2d.b2BodyDef();
		bodyDef.set_type(box2d.b2_staticBody);
		var body = world.CreateBody(bodyDef);
		body.CreateFixture(shape, 0.0);
	}

	function createRobot() {
		var position = new box2d.b2Vec2(Math.random() * ARENA_WIDTH, Math.random() * ARENA_HEIGHT);

		var shape = new box2d.b2PolygonShape();
		var size = ROBOT_SIZE / 2;
		shape.SetAsBox(size, size);

		var bodyDef = new box2d.b2BodyDef();
		bodyDef.set_type(box2d.b2_dynamicBody);
		bodyDef.set_position(position);
		bodyDef.set_angle(Math.PI);
		var body = world.CreateBody(bodyDef);
		body.CreateFixture(shape, 5.0);

		return {body: body};
	}

	function simulate(frameList, numberOfFrames) {
		for (var frame = 0; frame < numberOfFrames; frame++) {
			forEachRobot(function(robot) {
				applyFriction(robot);
			});

			world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

			frameList.push(self.getFrame());
		}
	}

	function getRelativeVelocity(robot) {
		return robot.body.GetLinearVelocity().copy().rotate(-robot.body.GetAngle());
	}

	function slowDown(robot) {
		var impulse = new box2d.b2Vec2(0.0, -getRelativeVelocity(robot).get_y() * robot.body.GetMass())
				.rotate(robot.body.GetAngle());
		robot.body.ApplyLinearImpulse(impulse, robot.body.GetPosition());

		applyAngularImpulse(robot, -limitValue(robot.body.GetAngularVelocity(), -ROBOT_ANGULAR_SPEED, ROBOT_ANGULAR_SPEED));
	}

	function limitValue(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function executeCommand(robot, command) {
		switch (command) {
		case 'forward':
			applyImpulse(robot, ROBOT_SPEED);
			break;

		case 'reverse':
			applyImpulse(robot, -ROBOT_SPEED_REVERSE);
			break;

		case 'turnleft':
			applyAngularImpulse(robot, -ROBOT_ANGULAR_SPEED);
			break;

		case 'turnright':
			applyAngularImpulse(robot, ROBOT_ANGULAR_SPEED);
			break;

		case 'turnleftslow':
			applyAngularImpulse(robot, -ROBOT_ANGULAR_SPEED/2);
			break;

		case 'turnrightslow':
			applyAngularImpulse(robot, ROBOT_ANGULAR_SPEED/2);
			break;
		}
	}

	function applyImpulse(robot, speed) {
		var impulse = new box2d.b2Vec2(0.0, speed * robot.body.GetMass()).rotate(robot.body.GetAngle());
		robot.body.ApplyLinearImpulse(impulse, robot.body.GetPosition());
	}

	function applyAngularImpulse(robot, angularSpeed) {
		robot.body.ApplyAngularImpulse(angularSpeed * robot.body.GetInertia());
	}

	function applyFriction(robot) {
		var frictionalForce = getRelativeVelocity(robot).copy()
				.mul(new box2d.b2Vec2(-LATERAL_FRICTION, 0))
				.rotate(robot.body.GetAngle());

		robot.body.ApplyForceToCenter(frictionalForce);
	}
}

exports.create = function() {
	return new World();
};
