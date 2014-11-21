angular.module('robotgame', ['directives', 'model', 'graphics'])

.controller('RobotGameCtrl', function($scope, $http, Model, Graphics) {
	$scope.connected = false;
	$http.get('data/commands.json').success(function(commands) {
		$scope.commandOptions = commands;
	});

	$scope.toggleReady = function() {
		$scope.ready ^= true;
		sendCommands();
	};

	$scope.selectCommand = function(command, option) {
		$scope.commands[command] = option;
		sendCommands();
	};

	$scope.$on('connecting', function() {
		$scope.$apply(function() {
			$scope.connected = false;
			$scope.message = 'Connecting to the server...';
		});
	});

	$scope.$on('update', function() {
		$scope.$apply(function() {
			if (!$scope.connected) {
				resetCommands();
			}

			$scope.connected = true;
			$scope.message = '';
			$scope.ready = false;
		});
	});

	$scope.$on('status', function() {
		$scope.$apply(function() {
			if (Model.hasStatus()) {
				$scope.message = 'Waiting for ' + Model.getNotReady() + ' player(s)...';
			} else {
				$scope.message = '';
			}
		});
	});

	$scope.game = Graphics.init();
	Model.connect(config.host);

	function sendCommands() {
		Model.sendCommands($scope.commands, $scope.ready);
	}

	function resetCommands() {
		$scope.commands = [];

		for (var i = 0; i < Model.getCommands(); i++) {
			$scope.commands.push('stop');
		}
	}
})
