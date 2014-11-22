var box2d = require('./box2d-extended.js').box2d;
var Robot = require('./robot.js').Robot;

var TIMESTEP = 1.0/60.0; // s
var COMMAND_FRAMES = 60;
var SLOWDOWN_FRAMES = 15;
var ARENA_WIDTH = 20.0; // m
var ARENA_HEIGHT = 15.0; // m
var GRAVITY = new box2d.b2Vec2(0.0, 0.0); // m/s^2
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;

function World() {
	var self = this;
	var robots;
	var world;

	init();

	this.createRobot = function() {
		var id = nextRobotId();
		var position = new box2d.b2Vec2(Math.random() * ARENA_WIDTH, Math.random() * ARENA_HEIGHT);
		robots[id] = new Robot(world, position);

		return id;
	};

	this.removeRobot = function(id) {
		robots[id].destroy();
		delete robots[id];
	};

	this.getTimestep = function() {
		return TIMESTEP;
	}

	this.getFrame = function() {
		var robotInfo = [];

		forEachRobot(function(robot, id) {
			robotInfo.push({
				id: id,
				position: {
					x: robot.getPosition().get_x(),
					y: robot.getPosition().get_y(),
				},
				rotation: robot.getRotation(),
			});
		});

		return {robots: robotInfo};
	};

	this.runTurn = function(commandList) {
		var frames = [];

		commandList.forEach(function(commands) {
			forEachRobot(function(robot, robotId) {
				robot.executeCommand(commands[robotId]);
			});

			simulate(frames, COMMAND_FRAMES);

			forEachRobot(function(robot) {
				robot.slowDown();
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

	function simulate(frameList, numberOfFrames) {
		for (var frame = 0; frame < numberOfFrames; frame++) {
			forEachRobot(function(robot) {
				robot.simulate();
			});

			world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

			frameList.push(self.getFrame());
		}
	}
}

exports.create = function() {
	return new World();
};
