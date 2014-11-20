var CONNECTION_TIMEOUT = 10000; // ms
var WINDOW_WIDTH = 800; // px
var WINDOW_HEIGHT = 600; // px
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var ROBOT_SIZE = 1; // m

var render;
var stage;
var connected;
var connectionTimeout;
var robot;
var time;
var frames;
var timestep;

window.onload = function() {
	stage = new PIXI.Stage(0xcccccc);
	render = createRenderer();
	robot = createRobot();
	connect();
}

function createRenderer() {
	var renderer = PIXI.autoDetectRenderer(WINDOW_WIDTH, WINDOW_HEIGHT);
	document.getElementById('game').appendChild(renderer.view);
	requestAnimFrame(animate);

	return function() {
		renderer.render(stage);
	}
}

function createRobot() {
	var texture = PIXI.Texture.fromImage('image/robot.png');
	var robot = new PIXI.Sprite(texture);
	robot.anchor.x = 0.5;
	robot.anchor.y = 0.5;

	return robot;
}

function connect() {
	setMessage('Connecting to the server...');

	connected = false;
	var socket = io(config.host);
	socket.on('update', update);
}

function setMessage(message) {
	document.getElementById('message').innerHTML = message;
}

function animate() {
	requestAnimFrame(animate);

	if (connected) {
		var timeElapsed = new Date() - time;
		var frame = Math.min(Math.floor(timeElapsed / timestep), frames.length - 1);

		robot.position.x = Math.round(frames[frame].object.position.x * WINDOW_WIDTH / ARENA_WIDTH);
		robot.position.y = Math.round(frames[frame].object.position.y * WINDOW_HEIGHT / ARENA_HEIGHT);
	}

	render();
}

function update(data) {
	if (!connected) {
		onConnected();
	}

	time = new Date();
	frames = data.frames;
	timestep = data.timestep;

	clearTimeout(connectionTimeout);
	connectionTimeout = setTimeout(onDisconnected, CONNECTION_TIMEOUT);
}

function onConnected() {
	connected = true;
	setMessage('');
	stage.addChild(robot);
}

function onDisconnected() {
	connected = false;
	setMessage('Connection lost!');
	stage.removeChildren();
}
