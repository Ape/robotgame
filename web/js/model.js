angular.module('model', [])

.service('Model', function($rootScope) {
	var socket;
	var update = null;
	var status = null;

	this.connect = function(host) {
		onConnecting();

		socket = io(host);
		socket.on('disconnect', onConnecting);
		socket.on('update', onUpdate);
		socket.on('status', onStatus);
	};

	this.sendCommands = function(commands, ready) {
		socket.emit('commands', {
			commands: commands,
			ready: ready,
		});
	};

	this.hasUpdate = function() {
		return update != null;
	};

	this.getUpdateTime = function() {
		return update.time;
	};

	this.getCommands = function() {
		return update.data.commands;
	};

	this.getTimestep = function() {
		return update.data.timestep;
	};

	this.getFrames = function() {
		return update.data.frames;
	};

	this.hasStatus = function() {
		return status != null;
	};

	this.getNotReady = function() {
		return status.notReady;
	};

	this.getTimeout = function() {
		return status.timeout;
	};

	function onConnecting() {
		update = null;
		$rootScope.$broadcast('connecting');
	}

	function onUpdate(data) {
		update = {
			data: data,
			time: new Date(),
		};
		status = null;

		$rootScope.$broadcast('update');
	}

	function onStatus(data) {
		if (data.timeout != null) {
			var timeout = new Date();
			timeout.setSeconds(timeout.getSeconds() + data.timeout);

			status = {
				notReady: data.notReady,
				timeout: timeout,
			};
		} else {
			status = null;
		}

		$rootScope.$broadcast('status');
	}
})
