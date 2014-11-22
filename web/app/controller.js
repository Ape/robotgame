angular.module('robotgame', ['directives', 'model', 'graphics'])

.controller('RobotGameCtrl', function($scope, $http, Model, Graphics) {
	onConnecting();
	Model.connect(config.host);

	$scope.game = Graphics.init();

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

	$scope.$on('disconnected', function() {
		$scope.$apply(onConnecting);
	});

	$scope.$on('update', function() {
		$scope.$apply(function() {
			if (!$scope.connected) {
				$scope.commands = Model.getCommands();
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

	function onConnecting() {
		$scope.connected = false;
		$scope.message = 'Connecting to the server...';
	}

	function sendCommands() {
		Model.sendCommands($scope.commands, $scope.ready);
	}
});
