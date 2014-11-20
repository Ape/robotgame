var PORT = 33668;
var PING_INTERVAL = 5000; // ms
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var TURN_TIME = 1; // s
var TIMESTEP = 1/60; // s
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;
var ROBOT_SIZE = 1; // m
var ROBOT_ACCELERATION = 40.0; // m/s^2
var ROBOT_TORQUE = 5.0; // radians/s^2
var LINEAR_FRICTION = 10.0;
var LATERAL_FRICTION = 20.0;
var ANGULAR_FRICTION = 2.0;

var http = require('http');
var io = require('socket.io')(http, { serveClient: false });
var box2d = require('./box2d-extended.js').box2d;

var world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
createWalls();
var object = createObject(new box2d.b2Vec2(10.0, 10.0));

io.listen(PORT);
io.on('connection', function(socket) {
	sendUpdate([ getCurrentFrame() ]);

	socket.on('command', function(command) {
		object.command = command.command;
	});

	socket.on('nextturn', function() {
		update();
	});
});

setInterval(function() {
	io.sockets.emit('ping');
}, PING_INTERVAL)

function update() {
	var frames = simulate();
	sendUpdate(frames);
};

function sendUpdate(frames) {
	var update = {
		timestep: 1000 * TIMESTEP,
		frames: frames,
	};

	io.sockets.emit('update', update);
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

function createObject(position) {
	var shape = new box2d.b2PolygonShape();
	var size = ROBOT_SIZE / 2;
	shape.SetAsBox(size, size);

	var bodyDef = new box2d.b2BodyDef();
	bodyDef.set_type(box2d.b2_dynamicBody);
	bodyDef.set_position(position);
	bodyDef.set_angle(Math.PI);
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
		simulateObject(object);
		world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
		frames.push(getCurrentFrame());
	}

	return frames;
}

function getCurrentFrame() {
	position = object.body.GetPosition();

	return {
		object: {
			position: {
				x: position.get_x(),
				y: position.get_y(),
			},
			rotation: object.body.GetAngle(),
		}
	}
}

function simulateObject(object) {
	var relativeVelocity = object.body.GetLinearVelocity().copy().rotate(-object.body.GetAngle());
	var speed = relativeVelocity.get_y();

	applyFriction(object, relativeVelocity);
	applyForce(object, speed);
	applyTorque(object);
}

function applyFriction(object, relativeVelocity) {
	var frictionalForce = relativeVelocity.copy()
			.mul(new box2d.b2Vec2(-LATERAL_FRICTION, -LINEAR_FRICTION))
			.rotate(object.body.GetAngle());
	var frictionalTorque = -ANGULAR_FRICTION * object.body.GetAngularVelocity();

	object.body.ApplyForceToCenter(frictionalForce);
	object.body.ApplyTorque(frictionalTorque);
}

function applyForce(object, speed) {
	var acceleration = 0.0;

	if (object.command == 'forward' || (object.command != 'reverse' && speed < 0.0)) {
		acceleration = ROBOT_ACCELERATION;
	} else if (object.command == 'reverse' || (speed > 0.0)) {
		acceleration = -ROBOT_ACCELERATION;
	}

	object.body.ApplyForceToCenter(new box2d.b2Vec2(0.0, acceleration).rotate(object.body.GetAngle()));
}

function applyTorque(object) {
	if (object.command == 'turnleft' || (object.command != 'turnright' && object.body.GetAngularVelocity() > 0)) {
		object.body.ApplyTorque(-ROBOT_TORQUE);
	} else if (object.command == 'turnright' || object.body.GetAngularVelocity() < 0) {
		object.body.ApplyTorque(ROBOT_TORQUE);
	}
}
