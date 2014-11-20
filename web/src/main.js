var CONNECTION_TIMEOUT = 10000; // ms
var WINDOW_WIDTH = 800; // px
var WINDOW_HEIGHT = 600; // px
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var ROBOT_SIZE = 1; // m

var socket;
var render;
var stage;
var texture = PIXI.Texture.fromImage('image/robot.png');
var connected;
var connectionTimeout;
var time;
var frames;
var timestep;
var timeout = null;

window.onload = function() {
	stage = new PIXI.Stage(0xcccccc);
	render = createRenderer();
	connect();
	observeCommandChanges();
}

function observeCommandChanges() {
	document.getElementById('command1').onchange = sendCommands;
	document.getElementById('command2').onchange = sendCommands;
	document.getElementById('command3').onchange = sendCommands;
	document.getElementById('command4').onchange = sendCommands;
	document.getElementById('ready').onclick = sendCommands;
}

function sendCommands() {
	socket.emit('commands', {
		commands: [
			document.getElementById('command1').value,
			document.getElementById('command2').value,
			document.getElementById('command3').value,
			document.getElementById('command4').value,
		],
		ready: document.getElementById('ready').checked,
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

function connect() {
	setMessage('Connecting to the server...');

	connected = false;
	socket = io(config.host);
	socket.on('ping', onPing);
	socket.on('update', onUpdate);
	socket.on('status', onStatus);
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

		stage.removeChildren();
		frame.robots.forEach(function(robot) {
			var sprite = new PIXI.Sprite(texture);
			sprite.anchor.x = 0.5;
			sprite.anchor.y = 0.5;
			sprite.position.x = Math.round(robot.position.x * WINDOW_WIDTH / ARENA_WIDTH);
			sprite.position.y = Math.round(robot.position.y * WINDOW_HEIGHT / ARENA_HEIGHT);
			sprite.rotation = robot.rotation;
			stage.addChild(sprite);
		});

		if (timeout != null) {
			var timeLeft = Math.max(timeout - new Date().getSeconds(), 1);
			var text = new PIXI.Text(timeLeft, {font: '50px Sans', fill: 'red'});
			stage.addChild(text);
		}
	}

	render();
}

function onConnected() {
	connected = true;
	setMessage('');
	document.getElementById('command1').value = 'stop';
	document.getElementById('command2').value = 'stop';
	document.getElementById('command3').value = 'stop';
	document.getElementById('command4').value = 'stop';
	document.getElementById('ready').checked = false;
}

function onDisconnected() {
	connected = false;
	setMessage('Connection lost!');
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

	setMessage('');
	timeout = null;
	document.getElementById('ready').checked = false;

	time = new Date();
	frames = data.frames;
	timestep = data.timestep;

	onPing();
}

function onStatus(data) {
	if (data.timeout != null) {
		setMessage('Waiting for ' + data.notReady + ' players to be ready...');
		timeout = new Date().getSeconds() + data.timeout;
	} else {
		setMessage('');
		timeout = null;
	}
}
