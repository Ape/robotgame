var PORT = 33668;
var TURN_TIMEOUT = 10; // s
var COMMANDS = 4;

var http = require('http');
var io = require('socket.io')(http, {serveClient: false});
var box2d = require('./box2d-extended.js').box2d;
var worldFactory = require('./world.js');

var players = [];
var world = worldFactory.create();
var turnTimeout = null;

io.listen(PORT);
io.on('connection', function(socket) {
	console.log('Player from ' + socket.handshake.address + ' connected.');

	var player = {
		robotId: world.createRobot(),
		ready: false,
		commands: getInitialCommands(),
	};
	players.push(player);

	var update = createUpdate([world.getFrame()]);
	socket.emit('update', update);

	socket.on('disconnect', function() {
		console.log('Player from ' + socket.handshake.address + ' disconnected.');
		world.removeRobot(player.robotId);
		checkTurnEnd();
	});

	socket.on('commands', function(commands) {
		player.ready = commands.ready;
		player.commands = commands.commands;
		checkTurnEnd();
	});
});

function getInitialCommands() {
	var commands = [];

	for (var i = 0; i < COMMANDS; i++) {
		commands.push('stop');
	}

	return commands;
}

function checkTurnEnd() {
	if (players.length == 0) {
		return;
	}

	var notReady = 0;
	players.forEach(function(player) {
		if (!player.ready) {
			notReady++;
		}
	});

	if (notReady == 0) {
		update();
	} else {
		if (notReady == players.length) {
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

function getTimeoutRemaining(timeout) {
	if (timeout == null) {
		return null;
	}

	return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

function update() {
	stopTurnTimeout();

	players.forEach(function(player) {
		player.ready = false;
	});

	var frames = world.runTurn(getCommandList());
	var update = createUpdate(frames);
	io.sockets.emit('update', update);
};

function getCommandList() {
	var commandList = [];

	for (var i = 0; i < COMMANDS; i++) {
		var commands = {};

		players.forEach(function(player) {
			commands[player.robotId] = player.commands[i];
		});

		commandList.push(commands);
	}

	return commandList;
}

function createUpdate(frames) {
	return {
		commands: COMMANDS,
		timestep: 1000 * world.getTimestep(),
		frames: frames,
	};
}
