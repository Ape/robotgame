var PORT = 33668;
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var TURN_TIMEOUT = 10; // s
var TIMESTEP = 1/60; // s
var COMMAND_TIME = 60 * TIMESTEP;
var SLOWDOWN_TIME = 18 * TIMESTEP;
var COMMANDS = 4;
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;
var ROBOT_SIZE = 1; // m
var ROBOT_SPEED = 2.0; // m/s
var ROBOT_SPEED_REVERSE = 1.0; // m/s
var ROBOT_ANGULAR_SPEED = Math.PI/2; // radians/s
var LATERAL_FRICTION = 10.0;

var http = require('http');
var io = require('socket.io')(http, {serveClient: false});
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

function getTimeoutRemaining(timeout) {
	if (timeout == null) {
		return null;
	}

	return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

function checkTurnEnd() {
	if (robots.length == 0) {
		return;
	}

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

	var frames = runTurn();
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
	};
}

function runTurn() {
	var frames = [];

	for (var commandNumber = 0; commandNumber < COMMANDS; commandNumber++) {
		robots.forEach(function(robot) {
			handleCommand(robot, robot.commands[commandNumber]);
		});

		simulate(frames, COMMAND_TIME / TIMESTEP);

		robots.forEach(function(robot) {
			slowDown(robot);
		});

		simulate(frames, SLOWDOWN_TIME / TIMESTEP);
	}

	return frames;
}

function simulate(frames, steps) {
	for (var step = 0; step < steps; step++) {
		robots.forEach(function(robot) {
			applyFriction(robot);
		});

		world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

		frames.push(getCurrentFrame());
	}
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

	return {robots: robotInfo};
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

function handleCommand(robot, command) {
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
