var PORT = 33668;
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var TURN_WAIT = 5000; // ms
var TURN_TIME = 1; // s
var TIMESTEP = 1/60; // s
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;
var ROBOT_SIZE = 1; // m
var ROBOT_ACCELERATION = 5.0; // m/s^2
var ROBOT_TORQUE = 5.0; // radians/s^2

var http = require('http');
var io = require('socket.io')(http, { serveClient: false });
var box2d = require('./box2d-extended.js').box2d;

var world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
createWalls();
var object = createObject(new box2d.b2Vec2(10.0, 10.0));

io.listen(PORT);
io.on('connection', function(socket) {
	socket.on('command', function(command) {
		object.command = command.command;
	});
});

setInterval(function() {
	var frames = simulate();

	var update = {
		timestep: 1000 * TIMESTEP,
		frames: frames,
	};

	io.sockets.emit('update', update);
}, TURN_WAIT);

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

function createObject(position) {
	var shape = new box2d.b2PolygonShape();
	var size = ROBOT_SIZE / 2;
	shape.SetAsBox(size, size);

	var bodyDef = new box2d.b2BodyDef();
	bodyDef.set_type(box2d.b2_dynamicBody);
	bodyDef.set_position(position);
	var body = world.CreateBody(bodyDef);
	body.CreateFixture(shape, 5.0);

	return {
		body: body,
		command: 'stop',
	}
}

function simulate() {
	var frames = [];

	for (var time = 0; time < TURN_TIME; time += TIMESTEP) {
		handleCommand();

		world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

		position = object.body.GetPosition();

		frames.push({
			object: {
				position: {
					x: position.get_x(),
					y: position.get_y(),
				},
				rotation: object.body.GetAngle(),
			}
		});
	}

	return frames;
}

function handleCommand() {
	switch (object.command) {
	case 'forward':
		var force = new box2d.b2Vec2(-ROBOT_ACCELERATION, 0.0).rotate(object.body.GetAngle());
		object.body.ApplyForceToCenter(force);
		break;

	case 'turnleft':
		object.body.ApplyTorque(-ROBOT_TORQUE);
		break;

	case 'turnright':
		object.body.ApplyTorque(ROBOT_TORQUE);
		break;
	}
}
