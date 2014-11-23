var _ = require('lodash');
var http = require('http');
var io = require('socket.io')(http, {serveClient: false});
var utils = require('./utils.js');
var World = require('./world.js').World;

var TURN_TIMEOUT = 10; // s
var STEPS_PER_TURN = 4;

exports.Game = function(port) {
	var players;
	var nextPlayerId;
	var world;
	var turnTimeout;

	init();
	listen(port);

	function init() {
		players = {};
		nextPlayerId = 0;
		world = new World();
		turnTimeout = null;
	}

	function listen(port) {
		io.listen(port);
		io.on('connection', function(socket) {
			console.log('Player from ' + socket.handshake.address + ' connected.');

			var playerId = nextPlayerId++;
			var player = {
				socket: socket,
				robotId: world.createRobot(),
				ready: false,
			};
			players[playerId] = player;

			world.getObject(player.robotId).setCommands(_.range(STEPS_PER_TURN)
					.map(function() {return 'stop';}));

			var update = createUpdate(player, [world.getFrame()]);
			socket.emit('update', update);

			socket.on('disconnect', function() {
				console.log('Player from ' + socket.handshake.address + ' disconnected.');
				world.removeObject(player.robotId);
				delete players[playerId];
				checkTurnEnd();
			});

			socket.on('commands', function(commands) {
				player.ready = commands.ready;
				world.getObject(player.robotId).setCommands(commands.commands);
				checkTurnEnd();
			});
		});
	}

	function checkTurnEnd() {
		if (_.size(players) === 0) {
			return;
		}

		var notReady = _.where(players, {'ready': false}).length;

		if (notReady === 0) {
			update();
		} else {
			if (notReady === _.size(players)) {
				stopTurnTimeout();
			} else if (!turnTimeout) {
				turnTimeout = setTimeout(update, TURN_TIMEOUT * 1000);
			}

			io.sockets.emit('status', {
				timeout: getTurnTimeoutRemaining(),
				notReady: notReady
			});
		}
	}

	function stopTurnTimeout() {
		clearTimeout(turnTimeout);
		turnTimeout = null;
	}

	function getTurnTimeoutRemaining() {
		if (turnTimeout === null) {
			return null;
		}

		return Math.ceil(utils.timeoutRemaining(turnTimeout) / 1000);
	}

	function update() {
		stopTurnTimeout();

		_.forEach(players, function(player) {
			player.ready = false;
		});

		var frames = world.runTurn(STEPS_PER_TURN);

		_.forEach(players, function(player) {
			player.socket.emit('update', createUpdate(player, frames));
		});
	}

	function createUpdate(player, frames) {
		return {
			stepsPerTurn: STEPS_PER_TURN,
			timestep: 1000 * world.getTimestep(),
			frames: frames,
		};
	}
};
