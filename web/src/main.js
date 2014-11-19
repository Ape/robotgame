var render;
var stage;
var connected;
var connectionTimeout;
var robot;

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
	robot.rotation += 0.05;
	render();
}

function update(state) {
	if (!connected) {
		onConnected();
	}

	robot.position.x = state.position.x;
	robot.position.y = state.position.y;

	clearTimeout(connectionTimeout);
	connectionTimeout = setTimeout(onDisconnected, 5000);
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
