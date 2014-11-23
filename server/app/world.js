var _ = require('lodash');
var box2d = require('./box2d-extended.js').box2d;
var Robot = require('./robot.js').Robot;

var TIMESTEP = 1.0/60.0; // s
var COMMAND_FRAMES_PER_STEP = 60;
var SLOWDOWN_FRAMES_PER_STEP = 15;
var ARENA_WIDTH = 20.0; // m
var ARENA_HEIGHT = 15.0; // m
var GRAVITY = new box2d.b2Vec2(0.0, 0.0); // m/s^2
var WALL_FRICTION = 0.2;
var WALL_RESTITUTION = 0.1;
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;

exports.World = function() {
	var self = this;
	var objects;
	var nextObjectId;
	var world;

	init();

	this.getWorld = function() {
		return world;
	};

	this.getTimestep = function() {
		return TIMESTEP;
	};

	this.getFrame = function() {
		return {objects: _.map(objects, getObjectUpdate)};
	};

	this.createRobot = function() {
		var id = nextObjectId++;
		var position = new box2d.b2Vec2(Math.random() * ARENA_WIDTH, Math.random() * ARENA_HEIGHT);
		objects[id] = new Robot(this, position);

		return id;
	};

	this.getObject = function(id) {
		return objects[id];
	};

	this.removeObject = function(id) {
		objects[id].destroy();
		delete objects[id];
	};

	this.runTurn = function(numberOfSteps) {
		return _.range(numberOfSteps).reduce(function(frames, stepNumber) {
			_.forEach(objects, function(object) {
				object.onCommandStep(stepNumber);
			});

			frames = frames.concat(simulate(COMMAND_FRAMES_PER_STEP));

			_.forEach(objects, function(object) {
				object.onSlowdownStep(stepNumber);
			});

			return frames.concat(simulate(SLOWDOWN_FRAMES_PER_STEP));
		}, []);
	};

	function init() {
		objects = {};
		nextObjectId = 0;
		world = new box2d.b2World(GRAVITY);
		createWalls();
	}

	function createWalls() {
		createWall(new box2d.b2Vec2(0.0, 0.0), new box2d.b2Vec2(ARENA_WIDTH, 0.0));
		createWall(new box2d.b2Vec2(ARENA_WIDTH, 0.0), new box2d.b2Vec2(ARENA_WIDTH, ARENA_HEIGHT));
		createWall(new box2d.b2Vec2(ARENA_WIDTH, ARENA_HEIGHT), new box2d.b2Vec2(0.0, ARENA_HEIGHT));
		createWall(new box2d.b2Vec2(0.0, ARENA_HEIGHT), new box2d.b2Vec2(0.0, 0.0));
	}

	function createWall(startPoint, endPoint) {
		var bodyDef = new box2d.b2BodyDef();
		bodyDef.set_type(box2d.b2_staticBody);
		body = world.CreateBody(bodyDef);

		var shape = new box2d.b2EdgeShape();
		shape.Set(startPoint, endPoint);

		var fixtureDef = new box2d.b2FixtureDef();
		fixtureDef.set_shape(shape);
		fixtureDef.set_friction(WALL_FRICTION);
		fixtureDef.set_restitution(WALL_RESTITUTION);
		body.CreateFixture(fixtureDef);
	}

	function getObjectUpdate(object, id) {
		return {
			id: parseInt(id),
			type: object.getType(),
			position: {
				x: object.getPosition().get_x(),
				y: object.getPosition().get_y(),
			},
			rotation: object.getRotation(),
		};
	}

	function simulate(numberOfFrames) {
		return _.range(numberOfFrames).map(function(frame) {
			_.forEach(objects, function(object) {
				object.simulate();
			});

			world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

			return self.getFrame();
		});
	}
};
