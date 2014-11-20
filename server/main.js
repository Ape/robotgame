var PORT = 33668;
var WINDOW_WIDTH = 800;
var WINDOW_HEIGHT = 600;
var TURN_WAIT = 5000; // ms
var TURN_TIME = 1; // s
var TIMESTEP = 1/60; // s
var VELOCITY_ITERATIONS = 6;
var POSITION_ITERATIONS = 2;

var http = require('http');
var io = require('socket.io')(http, { serveClient: false });
var box2d = require('./lib/box2d.js');

var world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
var object = createObject();

io.listen(PORT);

setInterval(function() {
	var frames = simulate();

	var update = {
		timestep: 1000 * TIMESTEP,
		frames: frames,
	};

	io.sockets.emit('update', update);
}, TURN_WAIT);

function createObject() {
	var shape = new box2d.b2PolygonShape();
	var size = 1.0;
	shape.SetAsBox(size, size);

	var bodyDef = new box2d.b2BodyDef();
	bodyDef.set_type(box2d.b2_dynamicBody);
	bodyDef.set_position(new box2d.b2Vec2(0.0, 0.0));
	var body = world.CreateBody(bodyDef);
	body.CreateFixture(shape, 5.0);
	body.SetLinearVelocity(new box2d.b2Vec2(10.0, 10.0));

	return { body: body }
}

function simulate() {
	var frames = [];

	for (var time = 0; time < TURN_TIME; time += TIMESTEP) {
		world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

		position = object.body.GetPosition();

		frames.push({
			object: {
				position: {
					x: position.get_x(),
					y: position.get_y(),
				}
			}
		});
	}

	return frames;
}
