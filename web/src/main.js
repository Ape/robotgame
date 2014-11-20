var CONNECTION_TIMEOUT = 10000; // ms
var WINDOW_WIDTH = 800; // px
var WINDOW_HEIGHT = 600; // px
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var ROBOT_SIZE = 1; // m

var socket;
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
	observeInputs();
}

function observeInputs() {
	observeCommandSelects();

	document.getElementById('nextturn').onclick = function() {
		socket.emit('nextturn');
	};
}

function observeCommandSelects() {
	document.getElementById('command1').onchange = sendCommands;
	document.getElementById('command2').onchange = sendCommands;
	document.getElementById('command3').onchange = sendCommands;
	document.getElementById('command4').onchange = sendCommands;
}

function sendCommands() {
	socket.emit('commands', {
		commands: [
			document.getElementById('command1').value,
			document.getElementById('command2').value,
			document.getElementById('command3').value,
			document.getElementById('command4').value,
		]
	});
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
	socket = io(config.host);
	socket.on('ping', onPing);
	socket.on('update', onUpdate);
}

function setMessage(message) {
	document.getElementById('message').innerHTML = message;
}

function animate() {
	requestAnimFrame(animate);

	if (connected) {
		var timeElapsed = new Date() - time;
		var frameNumber = Math.min(Math.floor(timeElapsed / timestep), frames.length - 1);
		var frame = frames[frameNumber];

		robot.position.x = Math.round(frame.object.position.x * WINDOW_WIDTH / ARENA_WIDTH);
		robot.position.y = Math.round(frame.object.position.y * WINDOW_HEIGHT / ARENA_HEIGHT);
		robot.rotation = frame.object.rotation;
	}

	render();
}

function onConnected() {
	connected = true;
	setMessage('');
	stage.addChild(robot);
	document.getElementById('command1').value = 'stop';
	document.getElementById('command2').value = 'stop';
	document.getElementById('command3').value = 'stop';
	document.getElementById('command4').value = 'stop';
}

function onDisconnected() {
	connected = false;
	setMessage('Connection lost!');
	stage.removeChildren();
}

function onPing() {
	if (connected) {
		clearTimeout(connectionTimeout);
		connectionTimeout = setTimeout(onDisconnected, CONNECTION_TIMEOUT);
	}
}

function onUpdate(data) {
	if (!connected) {
		onConnected();
	}

	time = new Date();
	frames = data.frames;
	timestep = data.timestep;

	onPing();
}
