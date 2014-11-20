var PORT = 33668;
var PING_INTERVAL = 5000; // ms
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var TURN_TIMEOUT = 10; // s
var TURN_TIME = 4; // s
var COMMANDS = 4;
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
var robots = [];
var turnTimeout = null;

io.listen(PORT);
io.on('connection', function(socket) {
	console.log('Player from ' + socket.handshake.address + ' connected.');

	var robot = createRobot(robots.length);
	robots.push(robot);

	sendUpdate([ getCurrentFrame() ]);

	socket.on('disconnect', function() {
		console.log('Player from ' + socket.handshake.address + ' disconnected.');

		world.DestroyBody(robot.body);

		var robotIndex = robots.indexOf(robot);
		if (robotIndex >= 0) {
			robots.splice(robotIndex, 1);
		}

		checkTurnEnd();
	});

	socket.on('commands', function(commands) {
		robot.commands = commands.commands;
		robot.ready = commands.ready;
		checkTurnEnd();
	});
});

setInterval(function() {
	io.sockets.emit('ping');
}, PING_INTERVAL)

function getTimeoutRemaining(timeout) {
	if (timeout == null) {
		return null;
	}

    return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

function checkTurnEnd() {
	var notReady = 0;
	robots.forEach(function(robot) {
		if (!robot.ready) {
			notReady++;
		}
	});

	if (notReady == 0) {
		update();
	} else {
		if (notReady == robots.length) {
			stopTurnTimeout();
		} else if (!turnTimeout) {
			turnTimeout = setTimeout(update, TURN_TIMEOUT * 1000);
		}

		io.sockets.emit('status', {
			timeout: getTimeoutRemaining(turnTimeout),
			notReady: notReady
		});
	}
}

function stopTurnTimeout() {
	clearTimeout(turnTimeout);
	turnTimeout = null;
}

function update() {
	stopTurnTimeout();

	robots.forEach(function(robot) {
		robot.ready = false;
	});

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

function createRobot(id) {
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

	return {
		id: id,
		body: body,
		ready: false,
		commands: ['stop', 'stop', 'stop', 'stop'],
	}
}

function simulate() {
	var frames = [];

	for (var time = 0; time < TURN_TIME; time += TIMESTEP) {
		var commandNumber = Math.floor(COMMANDS * time / TURN_TIME);

		robots.forEach(function(robot) {
			simulateRobot(robot, commandNumber);
		});

		world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
		frames.push(getCurrentFrame());
	}

	return frames;
}

function getCurrentFrame() {
	var robotInfo = [];

	robots.forEach(function(robot) {
		position = robot.body.GetPosition();

		robotInfo.push({
			id: robot.id,
			position: {
				x: position.get_x(),
				y: position.get_y(),
			},
			rotation: robot.body.GetAngle(),
		});
	});

	return { robots: robotInfo };
}

function simulateRobot(robot, commandNumber) {
	var command = robot.commands[commandNumber];
	var relativeVelocity = robot.body.GetLinearVelocity().copy().rotate(-robot.body.GetAngle());
	var speed = relativeVelocity.get_y();

	applyFriction(robot, relativeVelocity);
	applyForce(robot, command, speed);
	applyTorque(robot, command);
}

function applyFriction(robot, relativeVelocity) {
	var frictionalForce = relativeVelocity.copy()
			.mul(new box2d.b2Vec2(-LATERAL_FRICTION, -LINEAR_FRICTION))
			.rotate(robot.body.GetAngle());
	var frictionalTorque = -ANGULAR_FRICTION * robot.body.GetAngularVelocity();

	robot.body.ApplyForceToCenter(frictionalForce);
	robot.body.ApplyTorque(frictionalTorque);
}

function applyForce(robot, command, speed) {
	var acceleration = 0.0;

	if (command == 'forward' || (command != 'reverse' && speed < 0.0)) {
		acceleration = ROBOT_ACCELERATION;
	} else if (command == 'reverse' || (speed > 0.0)) {
		acceleration = -ROBOT_ACCELERATION;
	}

	robot.body.ApplyForceToCenter(new box2d.b2Vec2(0.0, acceleration).rotate(robot.body.GetAngle()));
}

function applyTorque(robot, command) {
	if (command == 'turnleft' || (command != 'turnright' && robot.body.GetAngularVelocity() > 0)) {
		robot.body.ApplyTorque(-ROBOT_TORQUE);
	} else if (command == 'turnright' || robot.body.GetAngularVelocity() < 0) {
		robot.body.ApplyTorque(ROBOT_TORQUE);
	}
}
