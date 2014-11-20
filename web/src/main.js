var WINDOW_WIDTH = 800; // px
var WINDOW_HEIGHT = 600; // px
var ARENA_WIDTH = 20; // m
var ARENA_HEIGHT = 15; // m
var ROBOT_SIZE = 1; // m

var GOLDEN_ANGLE = 2.399963159042158;
var GOLDEN_OFFSET = -1;

var socket;
var render;
var stage;
var texture = PIXI.Texture.fromImage('image/robot.png');
var connected;
var time;
var frames;
var timestep;
var timeout = null;

window.onload = function() {
	stage = new PIXI.Stage(0xcccccc);
	render = createRenderer();
	connect();
	observeCommandChanges();
};

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
	};
}

function connect() {
	onConnecting();

	socket = io(config.host);
	socket.on('disconnect', onConnecting);
	socket.on('update', onUpdate);
	socket.on('status', onStatus);
}

function setMessage(message) {
	document.getElementById('message').innerHTML = message;
}

function animate() {
	requestAnimFrame(animate);
	stage.removeChildren();

	if (connected) {
		var timeElapsed = new Date() - time;
		var frameNumber = Math.min(Math.floor(timeElapsed / timestep), frames.length - 1);
		var frame = frames[frameNumber];

		frame.robots.forEach(function(robot) {
			var sprite = new PIXI.Sprite(texture);
			sprite.anchor.x = 0.5;
			sprite.anchor.y = 0.5;
			sprite.position.x = Math.round(robot.position.x * WINDOW_WIDTH / ARENA_WIDTH);
			sprite.position.y = Math.round(robot.position.y * WINDOW_HEIGHT / ARENA_HEIGHT);
			sprite.rotation = robot.rotation;
			sprite.filters = [getHueFilter((robot.id + GOLDEN_OFFSET) * GOLDEN_ANGLE)];

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

function getHueFilter(angle) {
	var LUMA_RED = 0.299;
	var LUMA_GREEN = 0.587;
	var LUMA_BLUE = 0.114;

	var filter = new PIXI.ColorMatrixFilter();

	var x = Math.cos(angle);
	var y = Math.sin(angle);

	filter.matrix = [
		((LUMA_RED + (x * (1 - LUMA_RED))) + (y * -(LUMA_RED))),
		((LUMA_GREEN + (x * -(LUMA_GREEN))) + (y * -(LUMA_GREEN))),
		((LUMA_BLUE + (x * -(LUMA_BLUE))) + (y * (1 - LUMA_BLUE))),
		0,

		((LUMA_RED + (x * -(LUMA_RED))) + (y * 0.143)),
		((LUMA_GREEN + (x * (1 - LUMA_GREEN))) + (y * 0.14)),
		((LUMA_BLUE + (x * -(LUMA_BLUE))) + (y * -0.283)),
		0,

		((LUMA_RED + (x * -(LUMA_RED))) + (y * -((1 - LUMA_RED)))),
		((LUMA_GREEN + (x * -(LUMA_GREEN))) + (y * LUMA_GREEN)),
		((LUMA_BLUE + (x * (1 - LUMA_BLUE))) + (y * LUMA_BLUE)),
		0,

		0, 0, 0, 1,
	];

	return filter;
}

function onConnecting() {
	connected = false;
	setMessage('Connecting to the server...');
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
