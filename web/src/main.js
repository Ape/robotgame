var CONNECTION_TIMEOUT = 10000; // ms

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
	var renderer = PIXI.autoDetectRenderer(800, 600);
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
	robot.anchor.y = 0.62;

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

		robot.position.x = frames[frame].object.position.x;
		robot.position.y = frames[frame].object.position.y;
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
